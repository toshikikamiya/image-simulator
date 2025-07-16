document.addEventListener('DOMContentLoaded', () => {
  const widthSlider = document.getElementById('width-slider');
  const heightSlider = document.getElementById('height-slider');
  const bitsSlider = document.getElementById('bits-slider');
  const widthValue = document.getElementById('width-value');
  const heightValue = document.getElementById('height-value');
  const bitsValue = document.getElementById('bits-value');
  const sourceButtons = document.querySelectorAll('.btn-source');
  const colorButtons = document.querySelectorAll('.btn-color');
  const uploadArea = document.getElementById('upload-area');
  const imageUpload = document.getElementById('image-upload');
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const calculationResult = document.getElementById('calculation-result');
  const alertBox = document.getElementById('data-explosion-alert');

  let currentColorMode = 'color';
  const sampleImage = new Image();
  // ★★★ ここに、用意したAI画像ファイルの名前を入れる！ ★★★
  sampleImage.src = 'img/image-simulator-sample.png'; 
  
  const uploadedImage = new Image();
  let activeImage = sampleImage;

  sampleImage.onload = () => updateImageAndCalculation();
  sampleImage.onerror = () => {
      alert(`見本画像「${sampleImage.src}」の読み込みに失敗しました。\nファイル名が正しいか、ファイルがアップロードされているか確認してください。`);
  };

  [widthSlider, heightSlider, bitsSlider].forEach(slider => { slider.addEventListener('input', handleSliderInput); });
  sourceButtons.forEach(button => button.addEventListener('click', handleSourceChange));
  colorButtons.forEach(button => button.addEventListener('click', handleColorModeChange));
  imageUpload.addEventListener('change', handleImageUpload);

  function handleSliderInput(e) {
    const { id, value } = e.target;
    if (id === 'width-slider') widthValue.textContent = value;
    if (id === 'height-slider') heightValue.textContent = value;
    if (id === 'bits-slider') bitsValue.textContent = value;
    updateImageAndCalculation();
  }

  function handleSourceChange(e) {
    const source = e.target.dataset.source;
    sourceButtons.forEach(btn => btn.classList.toggle('active', btn === e.target));
    uploadArea.style.display = (source === 'upload') ? 'block' : 'none';
    activeImage = (source === 'upload' && uploadedImage.src) ? uploadedImage : sampleImage;
    updateImageAndCalculation();
  }

  function handleColorModeChange(e) {
    currentColorMode = e.target.dataset.mode;
    colorButtons.forEach(btn => btn.classList.toggle('active', btn === e.target));
    updateImageAndCalculation();
  }

  function handleImageUpload(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        uploadedImage.src = event.target.result;
        uploadedImage.onload = () => { activeImage = uploadedImage; updateImageAndCalculation(); };
      };
      reader.readAsDataURL(file);
    }
  }

  function updateImageAndCalculation() {
    if (!activeImage.src || !activeImage.complete || activeImage.naturalWidth === 0) return;
    drawImage();
    calculateAndDisplay();
  }

  function drawImage() {
    const displayWidth = Math.min(widthSlider.value, 1280);
    const displayHeight = Math.min(heightSlider.value, 1280);
    canvas.width = displayWidth;
    canvas.height = displayHeight;
    ctx.drawImage(activeImage, 0, 0, displayWidth, displayHeight);
    const imageData = ctx.getImageData(0, 0, displayWidth, displayHeight);
    const data = imageData.data;
    const bits = bitsSlider.value;
    const levels = Math.pow(2, bits);
    const step = 256 / (levels - 1);
    for (let i = 0; i < data.length; i += 4) {
      if (currentColorMode === 'mono') {
        const brightness = (data[i] * 0.299 + data[i+1] * 0.587 + data[i+2] * 0.114);
        const monoColor = Math.round(brightness / step) * step;
        data[i] = data[i+1] = data[i+2] = monoColor;
      } else {
        data[i] = Math.round(data[i] / step) * step;
        data[i+1] = Math.round(data[i+1] / step) * step;
        data[i+2] = Math.round(data[i+2] / step) * step;
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }

  function calculateAndDisplay() {
    const width = BigInt(widthSlider.value);
    const height = BigInt(heightSlider.value);
    const bits = BigInt(bitsSlider.value);
    const channels = (currentColorMode === 'color') ? 3n : 1n;
    const totalBits = width * height * bits * channels;
    const totalBytes = totalBits / 8n;
    function formatBytes(bytes) {
      if (bytes === 0n) return '0 Bytes';
      const k = 1000n;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
      let i = 0;
      let tempBytes = bytes;
      while (tempBytes >= k && i < sizes.length - 1) { tempBytes /= k; i++; }
      const displayValue = Number(bytes) / Math.pow(Number(k), i);
      return `${displayValue.toFixed(2)} ${sizes[i]}`;
    }
    const channelText = (currentColorMode === 'color') ? `× 3チャンネル` : `× 1チャンネル`;
    calculationResult.innerHTML = `
      <p>${width.toLocaleString()}px × ${height.toLocaleString()}px × ${bits.toLocaleString()}bit ${channelText} = <span>${totalBits.toLocaleString()} bit</span></p>
      <p>= <span>${formatBytes(totalBytes)}</span></p>`;
    if (totalBytes > 1_000_000n) { alertBox.style.display = 'block'; } else { alertBox.style.display = 'none'; }
  }
});
