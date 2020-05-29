function enableDragDrop(id) {
  const dropArea = document.getElementById(id);

  if (dropArea) {
    // Copy contents of files into the text input once they are read
    const fileReader = new FileReader();
    fileReader.onload = evt => {
      dropArea.value = evt.target.result;
    };

    // Drag and drop listeners
    dropArea.addEventListener('dragover', evt => {
      evt.stopPropagation();
      evt.preventDefault();
      evt.dataTransfer.dropEffect = 'copy';
    });

    dropArea.addEventListener('drop', evt => {
      evt.stopPropagation();
      evt.preventDefault();

      // Read the first file that was dropped
      const [file] = evt.dataTransfer.files;
      fileReader.readAsText(file, 'UTF-8');
    });
  } else {
    console.warn(`Could not enable drag/drop. No element matches id ${id}`);
  }
}
