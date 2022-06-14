import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";

import {
  getDoc,
  doc,
  getFirestore,
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";
import { fc } from "/js/c.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
const app = initializeApp(fc);
const db = getFirestore(app);
const auth = getAuth();
//import { fetchTime } from "./index.js";
onAuthStateChanged(auth, (user) => {
  if (user) {
    const uid = user.uid;
    //showUserEmail(user.email);
    loadUserData(user.email);
  } else {
    window.location = "/pages/login.html";
  }
});
async function loadUserData(email) {
  const ref = doc(db, "dealers", email);
  const docSnap = await getDoc(ref);
  if (docSnap.exists()) {
    let data = docSnap.data();
    showUserCredits(data.name, data.credit);
    let now = new Date();
    let date =
      now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate();
    historyTable(email, date);
  }
}

function showUserCredits(name, credit) {
  document.getElementById("profile-name").textContent += name;
  document.getElementById("user-credit").textContent = credit;
}
async function historyTable(email, date) {
  document.getElementById("comment-text").innerHTML = "";
  document.getElementById("credit-table").innerHTML = "";
  const ref = doc(db, "dealers", email, "offline", "lotto", "credits", date);

  const docSnap = await getDoc(ref);
  if (docSnap.exists()) {
    //   document.getElementById("credit-table").innerHTML = `<div class="line">
    //   <p class="number">Time</p>
    //   <p class="number" style="margin-left: 20px">
    //     &emsp;&emsp;&emsp;&emsp;&emsp;Amt
    //   </p>
    // </div>`;
    const credits = docSnap.data();
    let keys = Object.keys(credits);
    let totalCred = 0;
    keys.forEach((match) => {
      document.getElementById("credit-table").innerHTML +=
        // `  <div class="line">
        //  <p class="number">` +
        //match +
        // `</p>
        //   <p class="number" style="margin-left: 20px">:&emsp; ` +
        // credits[match] +
        // `</p>
        // </div>`;
        `<div class="client m-b-5">
        <div class="p-1-5">
          <p>
         Game Credit</p>
          <div class="card-inner">
            <p style="color: orangered"> + ` +
        credits[match] +
        `</p>
            <p>` +
        match +
        `</p>
          </div>
        </div>
      </div>`;
      totalCred += credits[match];
    });
    document.getElementById("credit-table").innerHTML +=
      `<div class="client m-b-5">
    <div class="p-1-5">
    <br>
     
      <div class="card-inner">
        <p style="color: orangered"> Total Win : ₹ ` +
      totalCred +
      `</p>
    </div>
  </div>`;
  } else
    document.getElementById("comment-text").innerHTML = `No win on ${date} 😕`;
}
const showBtn = document.getElementById("showBtn");
showBtn.addEventListener("click", () => {
  let date = document.getElementById("date").value;
  if (date) {
    let i1 = date.indexOf("-"),
      i2 = date.lastIndexOf("-");
    date =
      date.substring(0, i1 + 1) +
      (Number(date.substring(i1 + 1, i2)) / 10) * 10 +
      "-" +
      (Number(date.substring(i2 + 1, i2 + 3)) / 10) * 10;
  } else if (!date) {
    let now = new Date();
    let date1 =
      now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate();
    date = date1;
  }

  historyTable(auth.currentUser.email, date);
});
