window.onbeforeunloadPreventNavigation = true;
window.onbeforeunload = function (e) {
  // Simulating a spinner
  const spinner = document.getElementById('spinner');
  spinner.innerHTML = `<p>Loading ...</p>`;
  //The 2 lines bellow won't do nothing but should not generete an error
  e.preventDefault();
  e.returnValue = '';
  console.log('Navigating awway...');
};
