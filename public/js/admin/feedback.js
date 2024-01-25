function addInput() {
  // Get the container element
  var container = document.getElementById("inputContainer");

  // Create a new div element with the spe4ified structure
  var newDiv = document.createElement("div");
  newDiv.className = "col-12 mt-2";

  newDiv.innerHTML = `
      <input
        type="text"
        name="Name"
        class="form-control"
        id="validationCustom${container.children.length + 1}"
        required
      />
      <div class="valid-feedback">
        Looks good!
      </div>
    `;

  // Append the new div to the container
  container.appendChild(newDiv);
}

function submitFeedback() {
  // Collect data from all input fields
  let inputs = document.querySelectorAll(".form-control");
  let formData = new FormData();

  inputs.forEach(function (input) {
    formData.append(input.value, input.value);
  });

  // Make a POST request to the server
  fetch("/admin/feedback/create", {
    method: "POST",
    body: formData,
  })
    .then((response) => response.json())
    .then((data) => {
      location.reload();
    })
    .catch((error) => {
      // Handle errors during the request
      console.error("Error submitting feedback:", error);
    });
}

// Function to fetch and display programs from the server (demo data)
function fetchAndDisplayPrograms() {
  // You can use AJAX or fetch to get program data from the server
  // For demo purposes, let's create some dummy data
  let programs = [];

  fetch("/admin/programs/data")
    .then((res) => res.json())
    .then((data) => {
      programs = data.programs;
      // Display programs in the UI
      const programsContainer = document.querySelector(".programs-container");
      programsContainer.innerHTML = "";

      programs.forEach((program) => {
        const programCard = document.createElement("div");
        programCard.classList.add("program-card");

        programCard.innerHTML = `
        <a href="/admin/feedbacks/program/${program.ProgramID}">
            <h3>${program.Name}</h3></a>
            <!-- Add additional details if needed -->
        `;

        programsContainer.appendChild(programCard);
        console.log("🚀 ~ programs.forEach ~ program:", program);
      });
    });
  const dummyPrograms = [
    { id: 1, name: "Programs", Details: "View Programs feedback" },
    { id: 2, name: "Sessions", Details: "View sessions feedback" },
    { id: 3, name: "Trainers", Details: "View Trainers feedback" },
    { id: 3, name: "Monitors", Details: "View Monitors feedback" },
  ];
}

// Call the function to fetch and display programs when the page loads
document.addEventListener("DOMContentLoaded", fetchAndDisplayPrograms);
