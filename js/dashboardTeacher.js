import {
  getDatabase, ref, onValue, set, push, child, get
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js";

import {
  getAuth, onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js"
// import { getUserData } from "./modules.js"

const auth = getAuth()
const db = getDatabase()
let userId;


// ======================================
// para criar a tabela dos meus alunos

function retrieveData() {
  const auth = getAuth();
  const db = getDatabase();
  let userId;

  onAuthStateChanged(auth, (user) => {
    userId = user.uid;
    console.log(userId)
    if (user) {
      const professorsRef = ref(db, "/professors/" + userId + "/studentss");

      onValue(professorsRef, (snapshot) => {
        const studentsIdsObj = snapshot.val();
        if (studentsIdsObj !== null) {
          const studentIds = Object.values(studentsIdsObj);
          console.log("Student IDs:", studentIds);

          createTable(studentIds, db, "studentTable");
          tableFinancies(studentIds, db, "financies"); // Call tableFinancies here
          // selectPaymentByTeacherId(userId, studentIds)
          calculateTotalPaidAmount(userId, studentIds)
        } else {
          console.log("Você não possui nenhum aluno");
        }
      });
    }
  });
}


function createTable(studentIds, db, tableId) {
  const table = document.getElementById(tableId).getElementsByTagName("tbody")[0];
  let tbody = table.getElementsByTagName("tbody")[0];

  if (!tbody) {
    tbody = document.createElement("tbody");
    table.appendChild(tbody);
  }

  studentIds.forEach((studentId) => {
    const studentRef = ref(db, `/students/${studentId}`);

    onValue(studentRef, (snapshot) => {
      const studentData = snapshot.val();
      const row = table.insertRow();


      const imgCell = row.insertCell();
      imgCell.classList.add('studentData')
      imgCell.textContent = "---FOTO---";

      const firstNameCell = row.insertCell();
      firstNameCell.classList.add('studentData')
      firstNameCell.textContent = studentData.firstName;

      const lastNameCell = row.insertCell();
      lastNameCell.classList.add('studentData')
      lastNameCell.textContent = studentData.lastName;

      const accessPerfilCell = row.insertCell();
      const btn = document.createElement("a");
      btn.setAttribute("href", "#");
      btn.textContent = "Acessar Aluno";
      accessPerfilCell.appendChild(btn);

    });
  });
}

retrieveData()
// =================================================

function tableFinancies(studentIds, db, tableId) {
  const table = document.getElementById(tableId).getElementsByTagName("tbody")[0];
  // verificar se existe o tbody. Se nao existe, cria um elemento tbody
  if (!tbody) {
    tbody = document.createElement('tbody');
    table.appendChild(tbody)
  }

  studentIds.forEach((studentId) => {
    // selecionar os dados do firebase
    const studentRef = ref(db, 'students/' + studentId);
    onValue(studentRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        console.log("Name:", data.firstName);
        console.log("data true: " + data)
      }
      // console.log("tableId:" + tableId);
      // console.log("studentId:" + studentId)

      var pendencia = ""
      if (data) {
        const firstName = data.firstName;
        const pendencies = data.pendencies;

        if (pendencies == true) {
          pendencia = "pago"
          // console.log('pago')
        }
        else {
          pendencia = "nao pago"
          // console.log('nao pago')
        }
        // console.log("Name:", firstName);
        // console.log("Pendencies:", pendencies);

      }

      const row = table.insertRow();

      const imgCell = row.insertCell();
      imgCell.classList.add('studentData')
      imgCell.textContent = "---FOTO---";

      const firstNameCell = row.insertCell();
      firstNameCell.classList.add('pendencies')
      firstNameCell.textContent = data.firstName;

      const lastNameCell = row.insertCell();
      lastNameCell.classList.add('studentData')
      lastNameCell.textContent = pendencia;

      const accessPerfilCell = row.insertCell();
      const btn = document.createElement("a");
      btn.setAttribute("href", "#");
      btn.textContent = "Acessar Aluno";
      accessPerfilCell.appendChild(btn);
    });
  });
}

const studentIds = [];

const tableId = "studentsfinancies";
tableFinancies(studentIds, db, tableId);

// ===========================================

const addPayment = document.getElementById('payment')

addPayment.addEventListener('click', function(){
  const studentsId = "";
  const professorsId = "";
  console.log("studentId: " + studentsId)
  console.log("teachertId: " + professorsId)

  const db = getDatabase();
  const studentRef = ref(db, 'students/')
  const teacherRef = ref(db, 'professors/')
  const newPaymentRef = ref(db, 'payments/')
  const newPayment = push(newPaymentRef)
  const currentDate = new Date().toISOString().split('T')[0];

  set(newPayment, {
    teacherId: professorsId,
    studentId: studentsId,
    status: 'not paid',
    date: currentDate,
    amount: 250,
  })
    .then(() => {

      console.log('Payment added successfully.');
    })
    .catch((error) => {
      console.error('Error adding payment:', error);
    });

  // insertPayments(studentId, teacherId);
})

// =====================================================

const teste = document.getElementById('testeTotal');
let total = 0;
let arr = [];
const dbRef = ref(getDatabase());
let paymentid;
get(child(dbRef, `payments`)).then((snapshot) => {
  if (snapshot.exists()) {
    const data = snapshot.val();
    // console.log("Data:", data); //seleciona todos os nós filhos de payments
    for (const paymentId in data) {
      if (data.hasOwnProperty(paymentId)) { //percorre cada id de payments e exibe o id e o amount
        const payment = data[paymentId];
        paymentid = paymentId
        // console.log("Payment id: ", paymentId + " e amount: ", payment.amount);
        arr.push(payment.amount);
      }
    }
    // console.log(arr);
    for (let i = 0; i < arr.length; i++) {
      total += arr[i];
    }
    teste.textContent = total;
    // console.log("Total: " +total); //aqui é o total que deve ser exibido na tela
  } else {
    console.log("No data available");
  }
}).catch((error) => {
  console.error(error);
});


// ========================================

function calculateTotalPaidAmount(teacherId, studentIds) {
  const paymentRef = ref(db, 'payments/');
  let totalPaidAmount = 0;

  onValue(paymentRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const paidStudents = [];
      const notPaidStudents = [];

      for (const paymentId in data) {
        const payment = data[paymentId];
        const paymentDate = payment.date
        const studentId = payment.studentId;
        const status = payment.status;
        const amount = payment.amount;
        const teacherIds = payment.teacherId
        
        if (teacherId === teacherIds) {
          if (status === false && studentIds.includes(studentId)) {
            notPaidStudents.push({ studentId, amount, status, paymentDate, teacherId });
          } else if (status !== false && studentIds.includes(studentId)) {
            paidStudents.push({ studentId, amount, status, paymentDate, teacherId });
            totalPaidAmount += amount;
          }
        }
      }

      console.log('Paid Students:', paidStudents);
      console.log('Total Paid Amount:', totalPaidAmount);
      console.log('notPaidStudents: ' , notPaidStudents)
      console.log('teacherId: '+ teacherId)

    } else {
      console.log("No payment found for the specified teacherId.");
    }
  });
}