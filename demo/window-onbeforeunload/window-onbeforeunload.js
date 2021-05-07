window.onbeforeunload = function (e) {
  e.preventDefault();
  e.returnValue = "";
};
