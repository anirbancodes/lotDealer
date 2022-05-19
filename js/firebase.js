const firebaseConfig = {
  apiKey: "AIzaSyAVgBu0P69xgUHnZ2Cc4G5IX6gHtb4-MBE",
  authDomain: "qclottery.firebaseapp.com",
  projectId: "qclottery",
  storageBucket: "qclottery.appspot.com",
  messagingSenderId: "650163027647",
  appId: "1:650163027647:web:961de905315b549657500a",
};

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import {
  getDoc,
  doc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
  runTransaction,
  increment,
  setDoc,
  writeBatch,
  getFirestore,
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

import { fetchTime } from "./index.js";

const app = initializeApp(firebaseConfig);
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
    showUserCredits(data.name, data.credit);
    showDrawTbody(email);
  }
}

function showUserCredits(name, credit) {
  document.getElementById("profile-name").textContent = name;
  document.getElementById("user-credit").textContent = credit;
}

async function showDrawTbody(email) {
  const t22 = await fetchTime();
  let date = t22.date,
    min = t22.min,
    gameHr = t22.hr,
    ampm = t22.ampm;
  let gameMin = Math.ceil(min / 15) * 15;
  if (min == 0 || min == 15 || min == 30 || min == 45) gameMin += 15;
  if (gameMin == 60) {
    gameMin = 0;
    gameHr++;
  }
  let drawTime;
  if (gameHr < 9 && ampm == "AM") drawTime = "9:0 AM";
  else if (gameHr > 9 && ampm == "PM") drawTime = "9:0 AM";
  else drawTime = gameHr + ":" + gameMin + " " + t22.ampm;

  const ref = doc(db, "dealers", email, "offline", "lotto", "games", date);
  const docSnap = await getDoc(ref);
  if (docSnap.exists()) {
    let gameData = docSnap.data()[drawTime];
    if (gameData == undefined) console.log("oops");
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

/* async function testFuncFirebaseTimeCheck() {
  console.log(await fetchTime().time);
  await updateDoc(doc(db, "games", "2022-5-5"), {
    time: serverTimestamp(),
  });
}

document.getElementById("test-btn").addEventListener("click", () => {
  testFuncFirebaseTimeCheck();
}); */

async function add(user_email) {
  const amt = document.getElementById("amount").value;
  alert("89");
  await updateDoc(
    doc(db, "users", user_email),
    {
      credHist: arrayUnion({ time: date, trans: amt, how: "Dealer Added" }),
      credit: increment(amt),
      credits: arrayUnion({ time: date, trans: amt, how: "Dealer Added" }),
    },
    { merge: true }
  );
  //minus from dealer
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
      const t22 = await fetchTime();
      const date = t22.date,
        time = t22.time,
        ampm = t22.ampm;
      let min = t22.min,
        sec = t22.sec,
        gameHr = t22.hr;
      let gameMin = Math.ceil(min / 15) * 15;
      if (min == 0 || min == 15 || min == 30 || min == 45) gameMin += 15;
      if (gameMin == 60) {
        gameMin = 0;
        gameHr++;
      }
      let drawTime;
      if (gameHr < 9 && ampm == "AM") drawTime = "9:0 AM";
      else if (gameHr > 9 && ampm == "PM") {
        alert("Game Closed");
        betClicked = false;
        return;
      } else drawTime = gameHr + ":" + gameMin + " " + ampm;

      // if (min % 10 == 9 && sec >= 50) {
      //   alert("Time UP");
      //   window.location = "/";
      //   return;
      // }
      //
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

      /*const batch = writeBatch(db);

      batch.update(
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

      batch.update(doc(db, "dealers", email, "offline", "lotto"), {
        credit: increment(-1 * amount),
        totPlay: increment(amount),
      });

      batch.update(doc(db, "dealers", email), {
        credit: increment(-1 * amount),
      });
      batch.update(
        doc(db, "dealers", email, "offline", "lotto", "games", date),
        {
          [`${drawTime}.${number}`]: arrayUnion({
            time: time + " " + ampm,
            amt: amount,
          }),
        },
        { merge: true }
      );
      batch.update(
        doc(db, "dealers", email, "offline", "lotto", "sale", date),
        {
          [`${drawTime}`]: increment(Number(amount)),
        },
        { merge: true }
      );
      // .catch((error) => {
      //   betClicked = false;
      //   console.log(error);
      // });

      await batch.commit(); */

      /* await updateDoc(
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
      await updateDoc(
        doc(db, "dealers", email, "offline", "lotto"),
        {
          credit: increment(-1 * amount),
          totPlay: increment(amount),
        },
        { merge: true }
      );

      await updateDoc(
        doc(db, "dealers", email, "offline", "lotto", "games", date),
        {
          [`${drawTime}.${number}`]: arrayUnion({
            time: time + " "+ampm,
            amt: amount,
          }),
        },
        { merge: true }
      );
      await updateDoc(
        doc(db, "dealers", email, "offline", "lotto", "sale", date),
        {
          [`${drawTime}`]: increment(Number(amount)),
        },
        { merge: true }
      ).catch((error) => {
        betClicked = false;
        console.log(error);
      });

      await updateDoc(doc(db, "dealers", email), {
        credit: increment(-1 * amount),
      });
      */

      betClicked = false;
      //window.location = "/";
      document.getElementById("bet-amt").value = 0;
      await showDrawTbody(email);
    } else {
      alert(`insufficient credits, add credits`);
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
    alert("bet atleast 10 credit");
    //betClicked = false;
  }
});

const addBulkBtn = document.getElementById("btn-submit-bulk");
addBulkBtn.addEventListener("click", async (e) => {
  let nx = 0;
  for (let k = 1; k < 5; k++) {
    let scrip = Number(document.getElementById(`bulk` + k + `-scrip`).value);
    let amt = Number(document.getElementById(`bulk` + k + `-amt`).value);
    if (amt < 10) continue;
    const email = auth.currentUser.email;
    await play(email, scrip, amt);
    nx++;
  }
  alert(`placed ${nx} orders`);
});
