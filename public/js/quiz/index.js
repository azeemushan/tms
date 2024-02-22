let data = [];
let SessionID;
let QuizID;
let QuizName;

window.addEventListener("DOMContentLoaded", () => {
  const url = window.location.pathname;

  fetch(url + "/data")
    .then((res) => res.json())
    .then((resData) => {
      data = resData.quiz;

      SessionID = data.SessionID;
      QuizID = data.id;
      QuizName = data.name;

      if (data) main();
    });
});

const quizContainer = document.getElementById("quiz");
const resultContainer = document.getElementById("result");
const submitButton = document.getElementById("submit");
const showAnswerButton = document.getElementById("showAnswer");
function main() {
  let currentQuestion = 0;
  let score = 0;
  let incorrectAnswers = [];

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  function displayQuestion() {
    const questionData = data.questions[currentQuestion];

    const questionElement = document.createElement("div");
    questionElement.className = "question";
    questionElement.innerHTML = questionData.question;

    const optionsElement = document.createElement("div");
    optionsElement.className = "options";

    const shuffledOptions = [...questionData.options];
    shuffleArray(shuffledOptions);

    for (let i = 0; i < shuffledOptions.length; i++) {
      const option = document.createElement("label");
      option.className = "option";

      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = "quiz";
      radio.value = shuffledOptions[i].value;

      const optionText = document.createTextNode(shuffledOptions[i].value);

      option.appendChild(radio);
      option.appendChild(optionText);
      optionsElement.appendChild(option);
    }

    quizContainer.innerHTML = "";
    quizContainer.appendChild(questionElement);
    quizContainer.appendChild(optionsElement);
  }

  function checkAnswer() {
    const selectedOption = document.querySelector('input[name="quiz"]:checked');
    if (selectedOption) {
      const answer = selectedOption.value;
      if (answer === data.questions[currentQuestion].answer) {
        score++;
      } else {
        incorrectAnswers.push({
          question: data.questions[currentQuestion].question,
          incorrectAnswer: answer,
          correctAnswer: data.questions[currentQuestion].answer,
        });
      }
      currentQuestion++;
      selectedOption.checked = false;
      if (currentQuestion < data.questions.length) {
        displayQuestion();
      } else {
        displayResult();
        submitForm();
      }
    }
  }

  function displayResult() {
    quizContainer.style.display = "none";
    submitButton.style.display = "none";
    showAnswerButton.style.display = "inline-block";
    resultContainer.innerHTML = `You scored ${score} out of ${data.questions.length}!`;
  }

  function showAnswer() {
    quizContainer.style.display = "none";
    submitButton.style.display = "none";
    showAnswerButton.style.display = "none";

    let incorrectAnswersHtml = "";
    for (let i = 0; i < incorrectAnswers.length; i++) {
      incorrectAnswersHtml += `
      <p>
        <strong>Question:</strong> ${incorrectAnswers[i].question}<br>
        <strong>Your Answer:</strong> ${incorrectAnswers[i].incorrectAnswer}<br>
        <strong>Correct Answer:</strong> ${incorrectAnswers[i].correctAnswer}
      </p>
    `;
    }

    resultContainer.innerHTML = `
    <p>You scored ${score} out of ${data.questions.length}!</p>
    <p>Incorrect Answers:</p>
    ${incorrectAnswersHtml}
  `;
  }

  function submitForm() {
    const url = window.location.pathname;

    let SubmissionData = {
      QuizID,
      QuizName,
      SessionID,
      score,
    };
    fetch(url + "/create", {
      method: "post",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ SubmissionData }),
    })
      .then((response) => response.json())
      .then((result) => {
        window.location.pathname = result.redirectTo;
      })
      .catch((error) => {
        alert("Error in submitting the form");
      });
  }

  submitButton.addEventListener("click", checkAnswer);
  showAnswerButton.addEventListener("click", showAnswer);

  displayQuestion();
}
