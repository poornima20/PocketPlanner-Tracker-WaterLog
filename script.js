const STORAGE_KEY = "fullmoon.pocketplanner.waterlog";
const daysContainer = document.getElementById("daysContainer");
const weekTotal = document.getElementById("weekTotal");
const weekRange = document.getElementById("weekRange");
const monthName = document.getElementById("monthName");
const cupsCount = document.getElementById("cupsCount");

const ML_PER_DROP = 250;
let weekOffset = 0;
let totalDrops = 0;

function getWaterData() {
  const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));

  return stored?.data || {};
}

function saveWaterData(data) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      data,
      updatedAt: Date.now(),
    }),
  );

  // notify dashboard sync
  window.parent.postMessage(
    {
      type: "plannerUpdated",
      key: STORAGE_KEY,
    },
    "*",
  );
}

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function updateTotals() {
  totalDrops = document.querySelectorAll(".drop.filled").length;
  weekTotal.textContent = `${totalDrops * ML_PER_DROP} ml`;
  cupsCount.textContent = `${totalDrops} cups`;
}

function renderWeek() {
  daysContainer.innerHTML = "";
  totalDrops = 0;

  const today = new Date();
  const baseDate = new Date(today);
  baseDate.setDate(today.getDate() + weekOffset * 7);

  const start = getWeekStart(baseDate);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  weekRange.textContent = `${start.getDate()} ${start.toLocaleString("default", { month: "short" })} - 
     ${end.getDate()} ${end.toLocaleString("default", { month: "short" })}`;

  monthName.textContent = start.toLocaleString("default", { month: "long" });

  const weekKey = start.toISOString().split("T")[0]; // unique key
  const savedData = getWaterData();
  const weekData = savedData[weekKey] || {};

  const dayNames = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

  let todayIndex = today.getDay();
  todayIndex = todayIndex === 0 ? 6 : todayIndex - 1;

  for (let i = 0; i < 7; i++) {
    const row = document.createElement("div");
    row.className = "day-row";

    const label = document.createElement("div");
    label.className = "day-label";
    const dateForDay = new Date(start);
    dateForDay.setDate(start.getDate() + i);

    label.innerHTML = `
      <span class="day-name">${dayNames[i]}</span>
      <span class="day-date">${dateForDay.getDate()}</span>
    `;

    if (weekOffset === 0 && i === todayIndex) {
      label.classList.add("today");
    }

    const dropsContainer = document.createElement("div");
    dropsContainer.className = "drops";

    for (let j = 0; j < 8; j++) {
      const drop = document.createElement("div");
      drop.className = "drop";

      drop.innerHTML = `
        <svg viewBox="0 0 24 24" class="drop-svg">
          <path d="M12 2C12 2 5 10 5 15a7 7 0 0 0 14 0c0-5-7-13-7-13z"/>
        </svg>
      `;

      // Load saved state
      if (weekData[i] && weekData[i].includes(j)) {
        drop.classList.add("filled");
        totalDrops++;
      }

      drop.addEventListener("click", () => {
        // Get all droplets for this day
        const allDrops = dropsContainer.querySelectorAll(".drop");

        // If clicked droplet is already filled,
        // remove this droplet and everything after it.
        if (drop.classList.contains("filled")) {
          savedData[weekKey][i] = [];

          allDrops.forEach((d, index) => {
            if (index < j) {
              d.classList.add("filled");
              savedData[weekKey][i].push(index);
            } else {
              d.classList.remove("filled");
            }
          });
        }

        // Otherwise fill everything from first droplet to clicked droplet.
        else {
          savedData[weekKey][i] = [];

          allDrops.forEach((d, index) => {
            if (index <= j) {
              d.classList.add("filled");
              savedData[weekKey][i].push(index);
            } else {
              d.classList.remove("filled");
            }
          });
        }

        saveWaterData(savedData);
        updateTotals();
      });

      dropsContainer.appendChild(drop);
    }

    row.appendChild(label);
    row.appendChild(dropsContainer);
    daysContainer.appendChild(row);
  }

  updateTotals();
}

renderWeek();

document.getElementById("prevWeek").addEventListener("click", () => {
  weekOffset--;
  renderWeek();
});

document.getElementById("nextWeek").addEventListener("click", () => {
  weekOffset++;
  renderWeek();
});

document.getElementById("monthName").addEventListener("click", () => {
  weekOffset = 0; // reset to current week
  renderWeek();
});
