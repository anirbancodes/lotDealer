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
  const ref = doc(db, "dealers", email, "offline", "lotto", "credits", date);

  const docSnap = await getDoc(ref);
  if (docSnap.exists()) {
    document.getElementById("credit-table").innerHTML = `<div class="line">
    <p class="number">Time</p>
    <p class="number" style="margin-left: 20px">
      &emsp;&emsp;&emsp;&emsp;&emsp;Amt
    </p>
  </div>`;
    const credits = docSnap.data();
    let keys = Object.keys(credits);
    keys.forEach((match) => {
      document.getElementById("credit-table").innerHTML +=
        `  <div class="line">
          <p class="number">` +
        match +
        `</p>
          <p class="number" style="margin-left: 20px">:&emsp; ` +
        credits[match] +
        `</p>
        </div>`;
    });
  } else alert("No credit added today");
}
const showBtn = document.getElementById("showBtn");
showBtn.addEventListener("click", () => {
  let date = document.getElementById("date").value;
  let i1 = date.indexOf("-"),
    i2 = date.lastIndexOf("-");
  date =
    date.substring(0, i1 + 1) +
    (Number(date.substring(i1 + 1, i2)) / 10) * 10 +
    "-" +
    (Number(date.substring(i2 + 1, i2 + 3)) / 10) * 10;
  if (!date) {
    let now = new Date();
    let date1 =
      now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate();
    date = date1;
  }

  historyTable(auth.currentUser.email, date);
});
