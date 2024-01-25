const data = localStorage.getItem("user");

if (data) {
  let userData = JSON.parse(data);
  let userType = userData.UserType;

  if (userType !== "STUDENT") {
    window.location.href = "/";
  }
}
