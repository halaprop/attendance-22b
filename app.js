const queryParams = getQueryParams();

const checkinScreen = document.getElementById('checkin-screen');
const regScreen = document.getElementById('reg-screen');
const doneScreen = document.getElementById('done-screen');

const serverBaseURL = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://attendance-22b-proxy.onrender.com';

setupForms();
startState();


function startState() {
  const authToken = localStorage.getItem('authToken');
  if (authToken) {
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
  return `<h3>${title}<br><small class="uk-text-meta">${subtitle}</small></h3>`
}

function setupForms() {
  // enable checkin after table selection
  document.querySelectorAll('input[name="table"]').forEach(radio => {
    radio.addEventListener('change', event => document.getElementById('checkin-button').disabled = false);
  });

  // table submit
  document.getElementById('table-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const selectedTableButton = document.querySelector('input[name="table"]:checked');
    const selectedTable = selectedTableButton ? selectedTableButton.value : null;
    await checkIn(selectedTable);
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
  const path = 'login';
  const url = `${serverBaseURL}/${path}`;

  const headers = { 'Content-Type': 'application/json' };
  const params = { method: "POST", headers };
  params.body = JSON.stringify(user);

  const response = await fetch(url, params);
  let authToken = null;
  if (response.ok) {
    authToken = await response.json(); 
    localStorage.setItem('authToken', JSON.stringify(authToken));  
    localStorage.setItem('user', JSON.stringify(user));
  }
  return authToken;
}

async function checkIn(table='') {

  const path = 'checkin';
  const url = `${serverBaseURL}/${path}`;

  const headers = { 'Content-Type': 'application/json' };
  const params = { method: "POST", headers };

  const authToken = localStorage.getItem('authToken');
  const d = queryParams.d;
  if (!d || !authToken) return;

  const time = (new Date()).getTime();
  params.body = JSON.stringify({ d, table, time, authToken});

  const response = await fetch(url, params);
  const responseObj = await response.json();
  return responseObj;
}
