
const FALLBACK_PARAGRAPHS = [
  "The sun had just set behind the mountains when the travelers finally reached the village. They were tired and hungry, but the warm lights from the windows gave them hope. A kind old woman opened her door and welcomed them inside.",
  "Programming is the art of telling another human what one wants the computer to do. Every line of code is a small decision made by a person who imagined a future in which machines could understand human intentions precisely.",
  "The ocean is one of the most mysterious places on Earth. Beneath its surface lies a world of strange creatures and ancient secrets. Scientists estimate that more than eighty percent of the ocean remains unexplored today.",
  "Reading books is one of the best habits a person can develop. Books expand your vocabulary, sharpen your thinking, and take you to places you have never been. Even twenty minutes of reading a day makes a difference.",
  "Technology has changed the way people communicate. In the past, sending a letter across the world could take weeks. Today, a message travels in milliseconds. This instant connection has made the world smaller but more complex.",
  "A good night of sleep is essential for both physical and mental health. During sleep, your body repairs itself and your brain processes the events of the day. Most adults need between seven and nine hours each night.",
  "Cooking at home is not only healthier than eating out, it is also a creative and satisfying activity. When you cook, you control what goes into your food. With practice, even simple meals can become something truly special.",
  "The first step to learning anything new is accepting that you will be bad at it in the beginning. Beginners make mistakes, and that is normal. The key is to stay curious, ask questions, and keep practicing every day."
];

const textDisplay  = document.getElementById("text-display");
const inputArea    = document.getElementById("input-area");
const loadingMsg   = document.getElementById("loading-msg");
const resultCard   = document.getElementById("result-card");
const progressBar  = document.getElementById("progress-bar");
const statusMsg    = document.getElementById("status-msg");


const wpmEl    = document.getElementById("wpm");
const accEl    = document.getElementById("acc");
const timerEl  = document.getElementById("timer");
const errorsEl = document.getElementById("errors");


const rWpm    = document.getElementById("r-wpm");
const rAcc    = document.getElementById("r-acc");
const rTime   = document.getElementById("r-time");
const rErrors = document.getElementById("r-errors");


let paragraph      = "";   
let typed          = "";   
let startTime      = null; 
let timerInterval  = null; 
let elapsedSeconds = 0;    
let finished       = false;


async function fetchParagraph() {
  try {
    
    const response = await fetch(
      "https://api.quotable.io/quotes/random?minLength=120&maxLength=280"
    );

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data = await response.json(); 

    
    if (data && data[0] && data[0].content) {
      return data[0].content;
    } else {
      throw new Error("Unexpected data format");
    }

  } catch (error) {
    
    console.warn("Fetch failed, using fallback paragraph.", error);
    const randomIndex = Math.floor(Math.random() * FALLBACK_PARAGRAPHS.length);
    return FALLBACK_PARAGRAPHS[randomIndex];
  }
}


function renderText() {
  let html = "";

  for (let i = 0; i < paragraph.length; i++) {
    
    const displayChar = paragraph[i] === " " ? "&nbsp;" : paragraph[i];

    if (i < typed.length) {
      
      const cssClass = typed[i] === paragraph[i] ? "correct" : "wrong";
      html += `<span class="char ${cssClass}">${displayChar}</span>`;

    } else if (i === typed.length) {
      
      html += `<span class="char cursor">${displayChar}</span>`;

    } else {
      
      html += `<span class="char">${displayChar}</span>`;
    }
  }

  textDisplay.innerHTML = html;

  
  const percent = Math.min(100, Math.round((typed.length / paragraph.length) * 100));
  progressBar.style.width = percent + "%";
}


function calcStats() {
  
  const minutes = elapsedSeconds / 60 || 0.0001; 
  const wordCount = typed.trim().split(/\s+/).filter(Boolean).length;
  const wpm = elapsedSeconds > 0 ? Math.round(wordCount / minutes) : 0;

  
  let correctChars = 0;
  for (let i = 0; i < typed.length; i++) {
    if (typed[i] === paragraph[i]) correctChars++;
  }

 
  const accuracy = typed.length > 0
    ? Math.round((correctChars / typed.length) * 100)
    : 0;

  const errorCount = typed.length - correctChars;

  return { wpm, accuracy, errorCount };
}

function updateLiveStats() {
  const { wpm, accuracy, errorCount } = calcStats();

  wpmEl.textContent    = wpm;
  accEl.textContent    = typed.length > 0 ? accuracy + "%" : "—";
  timerEl.textContent  = elapsedSeconds + "s";
  errorsEl.textContent = errorCount;
}


function showResult() {
  clearInterval(timerInterval); 
  finished = true;
  inputArea.disabled = true;

  const { wpm, accuracy, errorCount } = calcStats();

  
  rWpm.textContent    = wpm;
  rAcc.innerHTML      = accuracy + '<span class="ru">%</span>';
  rTime.innerHTML     = elapsedSeconds + '<span class="ru">s</span>';
  rErrors.textContent = errorCount;

  
  textDisplay.style.display = "none";
  resultCard.classList.add("show");
  statusMsg.textContent = "Done! Check your results above.";
}


async function loadParagraph() {
 
  loadingMsg.style.display = "block";
  textDisplay.style.display = "none";
  resultCard.classList.remove("show");
  inputArea.disabled = true;
  inputArea.value = "";
  statusMsg.textContent = "Fetching a paragraph…";


  typed          = "";
  startTime      = null;
  elapsedSeconds = 0;
  finished       = false;
  clearInterval(timerInterval);

  // Reset stats display
  progressBar.style.width = "0%";
  wpmEl.textContent    = "0";
  accEl.textContent    = "—";
  timerEl.textContent  = "0s";
  errorsEl.textContent = "0";

  // Fetch paragraph (Fetch API call)
  paragraph = await fetchParagraph();

  // Show text display
  loadingMsg.style.display = "none";
  textDisplay.style.display = "block";
  inputArea.disabled = false;
  statusMsg.textContent = "Click the box below and start typing!";

  renderText();
  inputArea.focus(); // auto-focus the input
}


inputArea.addEventListener("input", () => {
  if (finished) return;

  typed = inputArea.value;

  // Start the timer on first keystroke
  if (!startTime && typed.length > 0) {
    startTime = Date.now();

    // Update timer every 500ms using setInterval (DOM-linked)
    timerInterval = setInterval(() => {
      elapsedSeconds = Math.round((Date.now() - startTime) / 1000);
      updateLiveStats();
    }, 500);
  }

  // Clamp typed to paragraph length (don't allow going over)
  if (typed.length > paragraph.length) {
    typed = typed.slice(0, paragraph.length);
    inputArea.value = typed;
  }

  renderText();      
  updateLiveStats(); 

  
  if (typed.length === paragraph.length) {
    showResult();
  }
});


inputArea.addEventListener("keydown", (e) => {
  if (e.key === "Tab") {
    e.preventDefault(); 
  }
});


document.getElementById("reset-btn").addEventListener("click", () => {
  loadParagraph();
});


document.getElementById("try-again-btn").addEventListener("click", () => {
  loadParagraph();
});


loadParagraph();
