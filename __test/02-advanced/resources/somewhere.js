import("./nowhere.js").then(({ message }) => {
  console.log("IO", message);
});

export default message = "Hello! I'm from somewhere!";