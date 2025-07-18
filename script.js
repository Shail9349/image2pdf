document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('fileInput');
    const dropArea = document.getElementById('dropArea');
    const previewArea = document.getElementById('previewArea');
    const convertBtn = document.getElementById('convertBtn');
    const statusDiv = document.getElementById('status');
    const compressCheckbox = document.getElementById('compressCheckbox');
    const pdfNameInput = document.getElementById('pdfName');
    
    let files = [];
    
    // Handle drag and drop events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        dropArea.classList.add('highlight');
    }
    
    function unhighlight() {
        dropArea.classList.remove('highlight');
    }
    
    dropArea.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const newFiles = dt.files;
        handleFiles(newFiles);
    }
    
    fileInput.addEventListener('change', function() {
        handleFiles(this.files);
    });
    
    function handleFiles(newFiles) {
        files = Array.from(newFiles);
        updatePreview();
        convertBtn.disabled = files.length === 0;
    }
    
    function updatePreview() {
        previewArea.innerHTML = '';
        
        files.forEach((file, index) => {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const imgContainer = document.createElement('div');
                imgContainer.className = 'img-container';
                
                const img = document.createElement('img');
                img.src = e.target.result;
                
                const removeBtn = document.createElement('button');
                removeBtn.textContent = 'Remove';
                removeBtn.className = 'remove-btn';
                removeBtn.onclick = () => removeImage(index);
                
                imgContainer.appendChild(img);
                imgContainer.appendChild(removeBtn);
                previewArea.appendChild(imgContainer);
            };
            
            reader.readAsDataURL(file);
        });
    }
    
    function removeImage(index) {
        files.splice(index, 1);
        updatePreview();
        convertBtn.disabled = files.length === 0;
    }
    
    convertBtn.addEventListener('click', async function() {
        if (files.length === 0) return;
        
        statusDiv.textContent = 'Converting to PDF...';
        statusDiv.style.color = '#3498db';
        
        try {
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF();
            const pdfName = pdfNameInput.value.trim() || 'converted';
            
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const imgData = await readFileAsDataURL(file);
                
                if (i > 0) {
                    pdf.addPage();
                }
                
                const img = new Image();
                img.src = imgData;
                
                await new Promise((resolve) => {
                    img.onload = function() {
                        const width = pdf.internal.pageSize.getWidth();
                        const height = (img.height * width) / img.width;
                        
                        pdf.addImage(imgData, 'JPEG', 0, 0, width, height);
                        resolve();
                    };
                });
            }
            
            if (compressCheckbox.checked) {
                // Simple compression by reducing quality
                // Note: jsPDF doesn't have built-in compression, this is a basic approach
                pdf.save(pdfName + '.pdf', { compression: true });
            } else {
                pdf.save(pdfName + '.pdf');
            }
            
            statusDiv.textContent = 'PDF created successfully!';
            statusDiv.style.color = '#27ae60';
        } catch (error) {
            console.error('Error creating PDF:', error);
            statusDiv.textContent = 'Error creating PDF: ' + error.message;
            statusDiv.style.color = '#e74c3c';
        }
    });
    
    function readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
});