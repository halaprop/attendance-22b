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
  const user = JSON.parse(localStorage.getItem('user'));
  if (user) {
    // if there's a user, prefill because we are editing
    const firstNameInput = document.getElementById('first-name');
    const lastNameInput = document.getElementById('last-name');
    const studentIDInput = document.getElementById('student-id');
    firstNameInput.value = user.firstName;
    lastNameInput.value = user.lastName;
    studentIDInput.value = user.studentID;
  }

  showScreen(regScreen);
}

function checkinState() {
  configureCheckinHeading();
  showScreen(checkinScreen);
}

function doneState() {
  const selectedTableButton = document.querySelector('input[name="table"]:checked');
  const selectedTable = selectedTableButton ? selectedTableButton.value : null;

  configureDoneHeading(selectedTable);
  showScreen(doneScreen);
}

function wdString() {
  let result = '';
  if (queryParams.d) {
    const clearD = atob(queryParams.d);
    const [quarter, weekAndDay] = clearD.split(';')
    const [week, day] = weekAndDay.split('-');
    result = `Week ${week}, Day ${day}`;
  }
  return result;
}

function configureCheckinHeading(selectedTable) {
  const welcomeEl = document.getElementById('welcome-msg');
  const studentIDEl = document.getElementById('welcome-msg-student-id');
  const dateEl = document.getElementById('welcome-msg-date');

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const firstName = user.firstName?.trim() ? `, ${user.firstName.trim()}` : '';

  welcomeEl.innerText = `Welcome${firstName}`;
  studentIDEl.innerText = `(${user.studentID})`;
  dateEl.innerText = wdString();
}

function configureDoneHeading(selectedTable) {
  const welcomeEl = document.getElementById('done-msg');
  const studentIDEl = document.getElementById('done-msg-student-id');
  const dateEl = document.getElementById('done-msg-date');

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const firstName = user.firstName?.trim() ? `, ${user.firstName.trim()}` : '';

  welcomeEl.innerText = `Welcome${firstName}`;
  studentIDEl.innerText = `(${user.studentID})`;
  dateEl.innerText = wdString();
  
  if (selectedTable) {
    const tableEl = document.getElementById('done-msg-table');
    tableEl.innerText = `Table ${selectedTable}`;
  }

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

  // edit reg data
  const editButtonEl = document.getElementById('edit-btn');
  editButtonEl.addEventListener('click', e => regState());
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
  const AIRTABLE_KEY = "patoWcpcDZLsEtbmb.70372fed236a15534bdd0c7c0c43c5dbf58065ee09e6e91781dc6f48e375997c";
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const d = queryParams.d;
  const time = (new Date()).getTime();
  const firstName = user.firstName;
  const lastName = user.lastName;
  const studentID = user.studentID;

  const record = { d, table, time, firstName, lastName, studentID };

  const url = `https://api.airtable.com/v0/appeEgKyuc6u0s3T4/checkins`;
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
