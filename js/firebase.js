import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { fc } from "/js/c.js";
import {
  getDoc,
  doc,
  arrayUnion,
  runTransaction,
  increment,
  getFirestore,
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";
import { fetchTime } from "./index.js";
const app = initializeApp(fc);
const db = getFirestore(app);
const auth = getAuth();
const logoutBtn = document.getElementById("logoutBtn");
logoutBtn.addEventListener("click", (e) => {
  signOut(auth)
    .then(() => {
      //logout
    })
    .catch((error) => {
      alert(error);
    });
});
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
    if (data.active == false) activateDealer(email, data.name);
    showUserCredits(data.name, data.credit);
    showDrawTbody(email);
  }
}

function showUserCredits(name, credit) {
  document.getElementById("profile-name").textContent = name;
  document.getElementById("user-credit").textContent = credit;
}

async function calcDrawTime() {
  const t22 = await fetchTime();
  let date = t22.date,
    time = t22.time,
    min = t22.min,
    gameHr = t22.hr,
    sec = t22.sec,
    ampm = t22.ampm;
  let gameMin = Math.ceil(min / 15) * 15;
  if (min == 0 || min == 15 || min == 30 || min == 45) gameMin += 15;
  if (gameMin == 60 && gameHr != 12) {
    gameMin = 0;
    gameHr++;
  } else if (gameMin == 60 && gameHr == 12) {
    gameMin = 0;
    gameHr = 1;
  }
  let drawTime;
  if (gameHr == 12 && gameMin == 0 && ampm == "AM") ampm = "PM";
  if (gameHr < 9 && ampm == "AM") drawTime = "9:0 AM";
  else if (gameHr > 9 && gameMin > 0 && ampm == "PM" && gameHr != 12)
    drawTime = "9:0 AM";
  else drawTime = gameHr + ":" + gameMin + " " + ampm;
  return { date, drawTime, time, gameHr, ampm, min, sec };
}

async function showDrawTbody(email) {
  /*const t22 = await fetchTime();

  let date = t22.date,
    min = t22.min,
    gameHr = t22.hr,
    ampm = t22.ampm;
  let gameMin = Math.ceil(min / 15) * 15;
  if (min == 0 || min == 15 || min == 30 || min == 45) gameMin += 15;

  if (gameMin == 60 && gameHr != 12) {
    gameMin = 0;
    gameHr++;
  } else if (gameMin == 60 && gameHr == 12) {
    gameMin = 0;
    gameHr = 1;
  }

  let drawTime;
  if (gameHr == 12 && gameMin == 0 && ampm == "AM") ampm = "PM";
  if (gameHr < 9 && ampm == "AM") drawTime = "9:0 AM";
  else if (gameHr > 9 && ampm == "PM" && gameHr != 12) drawTime = "9:0 AM";
  else drawTime = gameHr + ":" + gameMin + " " + ampm; */
  const { date, drawTime } = await calcDrawTime();

  const ref = doc(db, "dealers", email, "offline", "lotto", "games", date);
  const docSnap = await getDoc(ref);
  if (docSnap.exists()) {
    let gameData = docSnap.data()[drawTime];
    // if (gameData == undefined) console.log("oops");
    drawTbody(gameData);
  }
}

function drawTbody(data) {
  document.getElementById("game-draw-tbody").innerHTML = "";
  let keys = Object.keys(data);
  keys.forEach((i) => {
    let rowData = "";
    let ndata = data[i];
    rowData +=
      `<tr class="white-card">
    <td><strong>` +
      i +
      `</strong></td>
    <td><span style="margin-left: 20px">`;

    if (ndata != undefined) {
      ndata.forEach((n) => {
        rowData += n.amt + " + ";
      });
    }
    document.getElementById("game-draw-tbody").innerHTML +=
      rowData + `</span></td></tr>`;
  });
}

let betClicked = false;
//game - bet clicked
async function play(email, number, amount) {
  betClicked = true;
  const ref = doc(db, "dealers", email, "offline", "lotto");
  const docSnap = await getDoc(ref);
  if (docSnap.exists()) {
    let data = docSnap.data();
    if (amount <= data.credit) {
      /* const t22 = await fetchTime();
      const date = t22.date,
        time = t22.time,
        ampm = t22.ampm;
      let min = t22.min,
        sec = t22.sec,
        gameHr = t22.hr;
      let gameMin = Math.ceil(min / 15) * 15;
      if (min == 0 || min == 15 || min == 30 || min == 45) gameMin += 15;
      if (gameMin == 60 && gameHr != 12) {
        gameMin = 0;
        gameHr++;
      } else if (gameMin == 60 && gameHr == 12) {
        gameMin = 0;
        gameHr = 1;
      }

      let drawTime;
      if (gameHr == 12 && gameMin == 0 && ampm == "AM") ampm = "PM";
      if (gameHr < 9 && ampm == "AM") drawTime = "9:0 AM"; */
      //else
      const { date, drawTime, time, gameHr, ampm, min, sec } =
        await calcDrawTime();

      if (
        (gameHr > 9 && ampm == "PM" && gameHr != 12) |
        (gameHr == 12 && ampm == "AM")
      ) {
        alert("Game Closed");
        betClicked = false;
        return;
      } // else drawTime = gameHr + ":" + gameMin + " " + ampm; */

      if (
        (min % 10 == 59 && sec >= 45) ||
        (min % 10 == 14 && sec >= 45) ||
        (min % 10 == 29 && sec >= 45) ||
        (min % 10 == 44 && sec >= 45)
      ) {
        alert("Time UP");
        window.location = "/";
        return;
      }

      try {
        await runTransaction(db, async (transaction) => {
          const gamesDateDoc = await transaction.get(doc(db, "games", date));
          const gamesDealerDoc = await transaction.get(
            doc(db, "dealers", email, "offline", "lotto", "games", date)
          );
          if (!gamesDateDoc.exists()) {
            transaction.set(doc(db, "games", date), {});
          }

          if (!gamesDealerDoc.exists()) {
            transaction.set(
              doc(db, "dealers", email, "offline", "lotto", "games", date),
              {}
            );
            transaction.set(
              doc(db, "dealers", email, "offline", "lotto", "sale", date),
              {}
            );
          }

          transaction.update(
            doc(db, "games", date),
            {
              [`${drawTime}.${number}`]: arrayUnion({
                amt: amount,
                t: "d",
                time: time + " " + ampm,
                email: email,
              }),
            },
            { merge: true }
          );

          transaction.update(doc(db, "dealers", email, "offline", "lotto"), {
            credit: increment(-1 * amount),
            totPlay: increment(amount),
          });

          transaction.update(doc(db, "dealers", email), {
            credit: increment(-1 * amount),
          });
          transaction.update(
            doc(db, "dealers", email, "offline", "lotto", "games", date),
            {
              [`${drawTime}.${number}`]: arrayUnion({
                time: time + " " + ampm,
                amt: amount,
              }),
            },
            { merge: true }
          );
          transaction.update(
            doc(db, "dealers", email, "offline", "lotto", "sale", date),
            {
              [`${drawTime}`]: increment(Number(amount)),
            },
            { merge: true }
          );
        });
        console.log("Transaction successfully committed!");
      } catch (e) {
        console.log("Transaction failed: ", e);
      }

      betClicked = false;
      //window.location = "/";
      document.getElementById("bet-amt").value = 0;
      await showDrawTbody(email);
    } else {
      alert(`Insufficient balance`);
    }
  }
}

const btn = document.getElementById("btn-submit");
btn.addEventListener("click", async (e) => {
  if (betClicked === true) return;

  const bet_amt = Number(document.getElementById("bet-amt").value);
  let bet_no;
  let ele = document.getElementsByName("scrip");
  for (let i = 0; i < ele.length; i++) {
    if (ele[i].checked) bet_no = ele[i].value;
  }
  if (bet_amt >= 10) {
    const email = auth.currentUser.email;
    await play(email, bet_no, bet_amt, false);
    const ref = doc(db, "dealers", email);
    const docSnap = await getDoc(ref);
    if (docSnap.exists()) {
      let data = docSnap.data();
      showUserCredits(data.name, data.credit);
    }
  } else {
    alert("10 credit required");
    document.getElementById("bet-amt").value = 0;
    //betClicked = false;
  }
});

const addBulkBtn = document.getElementById("btn-submit-bulk");
const bulkFunc = async () => {
  console.log("clicked");
  addBulkBtn.removeEventListener("click", bulkFunc);
  let nx = 0;
  const email = auth.currentUser.email;
  for (let k = 1; k < 5; k++) {
    let scrip = Number(document.getElementById(`bulk` + k + `-scrip`).value);
    let amt = Number(document.getElementById(`bulk` + k + `-amt`).value);
    if (amt < 10) continue;
    await play(email, scrip, amt);
    nx++;
    document.getElementById(`bulk` + k + `-amt`).value = 0;
  }
  alert(`placed ${nx} orders`);
  const ref = doc(db, "dealers", email);
  const docSnap = await getDoc(ref);
  if (docSnap.exists()) {
    let data = docSnap.data();
    showUserCredits(data.name, data.credit);
  }
  addBulkBtn.addEventListener("click", bulkFunc);
};
addBulkBtn.addEventListener("click", bulkFunc);

async function activateDealer(email, name) {
  try {
    await runTransaction(db, async (transaction) => {
      transaction.update(doc(db, "dealers", email), {
        active: true,
      });
      transaction.set(doc(db, "dealers", email, "credits", "0"), {});

      transaction.set(doc(db, "dealers", email, "offline", "lotto"), {
        credit: 0,
        name: name,
        totPlay: 0,
      });

      transaction.set(
        doc(db, "dealers", email, "offline", "lotto", "credits", "0"),
        {}
      );

      transaction.set(
        doc(db, "dealers", email, "offline", "lotto", "games", "0"),
        {}
      );

      transaction.set(
        doc(db, "dealers", email, "offline", "lotto", "sale", "0"),
        {}
      );

      transaction.set(doc(db, "dealers", email, "agentsale", "0"), {});

      transaction.set(doc(db, "dealers", email, "online", "lotto"), {});

      transaction.set(doc(db, "dealers", email, "superCredit", "0"), {});
      console.log("Dealer Doc created");
    });
  } catch (e) {
    alert("Activation Failed");
    console.error(e);
  }
}
