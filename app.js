const queryParams = getQueryParams();

const checkinScreen = document.getElementById('checkin-screen');
const regScreen = document.getElementById('reg-screen');
const doneScreen = document.getElementById('done-screen');

const serverBaseURL = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://attendance-22b-proxy.onrender.com';

setupForms();
startState();


function startState() {
  const user = localStorage.getItem('user');
  if (user) {
    if (queryParams.d) {
      checkinState();
    } else {
      doneState();
    }
  } else {
    regState();
  }
}

function regState() {
  showScreen(regScreen);
}

function checkinState() {
  showScreen(checkinScreen);

  const checkinHeading = document.getElementById('checkin-heading');
  checkinHeading.innerHTML = headingMessage();
}

function doneState() {
  const selectedTableButton = document.querySelector('input[name="table"]:checked');
  const selectedTable = selectedTableButton ? selectedTableButton.value : null;

  const doneHeading = document.getElementById('done-heading');
  doneHeading.innerHTML = headingMessage(selectedTable);
  showScreen(doneScreen);
}

function headingMessage(selectedTable) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const firstName = user.firstName?.trim() ? `, ${user.firstName.trim()}` : '';
  const title = `Welcome${firstName}`;
  
  let subtitle = (new Date()).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  if (selectedTable) {
    subtitle += `, Table ${selectedTable}`;
  }


  let wdString = '';
  if (queryParams.d) {
    const clearD = atob(queryParams.d);
    const [quarter, weekAndDay] = clearD.split(';')
    const [week, day] = weekAndDay.split('-');
    wdString = `Week ${week}, Day ${day} - `;
  }

  return `
    <h3>${title}
      <p class="uk-text-meta uk-margin-remove-top"><span>${wdString}</span>${subtitle}</p>
    </h3>
  `;
}

function setupForms() {
  // enable checkin after table selection
  document.querySelectorAll('input[name="table"]').forEach(radio => {
    radio.addEventListener('change', event => document.getElementById('checkin-button').disabled = false);
  });

  // table submit
  document.getElementById('table-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const checkinButton = document.getElementById('checkin-button');
    checkinButton.disabled = true; 
    const selectedTableButton = document.querySelector('input[name="table"]:checked');
    const selectedTable = selectedTableButton ? selectedTableButton.value : null;
    await checkIn(selectedTable);
    checkinButton.disabled = false; 
    doneState();
  });

  // registration submit
  const regForm = document.getElementById('user-form');
  regForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const firstName = document.getElementById('first-name').value;
    const lastName = document.getElementById('last-name').value;
    const studentId = document.getElementById('student-id').value;

    const user = {
      firstName: firstName,
      lastName: lastName,
      studentID: studentId
    };
    const response = await login(user);
    startState();
  });
}


function getQueryParams() {
  const params = {};
  const queryString = window.location.search.substring(1);
  const regex = /[?&]?([^=]+)=([^&]*)/g;
  let tokens;
  while ((tokens = regex.exec(queryString)) !== null) {
    params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
  }
  return params || {};
}

function showScreen(screenElement) {
  [checkinScreen, regScreen, doneScreen].forEach(el => {
    (el == screenElement) ? el.classList.remove('uk-hidden') : el.classList.add('uk-hidden');
  });
}

async function login(user) {
  localStorage.setItem('user', JSON.stringify(user));
}

async function checkIn(table='') {

  const AIRTABLE_KEY = "patNeYtMUY5syUDLV.0f148945383c23f1c0adf4f0e24865872de25f48edee4ec50f88ab1e415c484d";
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const d = queryParams.d;
  const time = (new Date()).getTime();
  const firstName = user.firstName;
  const lastName = user.lastName;
  const studentID = user.studentID;

  const record = { d, table, time, firstName, lastName, studentID };

  const url = `https://api.airtable.com/v0/appQ7Fisb61XmiGXG/checkins`;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${AIRTABLE_KEY}`
  };
  const params = { method: "POST", headers };
  params.body = JSON.stringify({ records: [{ fields: record }]});

  const response = await fetch(url, params);
  const responseObj = await response.json(); 
  return responseObj;
}
