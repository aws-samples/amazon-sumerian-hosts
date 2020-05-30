const toggleButtons = document.getElementsByClassName('toggle');

for (let i = 0, l = toggleButtons.length; i < l; i += 1) {
  toggleButtons[i].addEventListener('click', function() {
    this.classList.toggle('opened');
    this.classList.toggle('closed');
    this.parentElement.nextElementSibling.classList.toggle('active');
    this.parentElement.nextElementSibling.classList.toggle('nested');
  });
}
