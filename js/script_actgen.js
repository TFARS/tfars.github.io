let activityIndex = 0;
const activityBackgrounds = [
    'url("/img/actcard1.png")', // 你可以替换成实际的图片URL
    'url("/img/actcard5.png")', // 你可以替换成实际的图片URL
    'url("/img/actcard6.png")', // 你可以替换成实际的图片URL
    'url("/img/actcard2.png")', // 你可以替换成实际的图片URL
    'url("/img/actcard7.png")', // 你可以替换成实际的图片URL
    // ... 添加更多背景图片
];

const colorItems = [
    'rgb(253, 21, 233)',
    'rgb(11, 132, 244)',
    'rgb(177, 42, 53)',
    'rgb(156, 13, 237)',
    'rgb(200,150,20)',
];


//标题内容监控
// 获取输入框和显示文本的DOM元素
const inputBox = document.getElementById('picTitle');
const displayText = document.getElementById('displayTitle');
// 监听输入框的input事件
inputBox.addEventListener('input', function () {
    // 更新显示文本的内容为输入框的当前值
    displayText.textContent = inputBox.value;
});



function addActivity() {
    const form = document.getElementById('activityForm');
    const formData = new FormData(form);

    const activityCard = document.createElement('div');
    activityCard.classList.add('activity-card');
    activityCard.style.backgroundImage = activityBackgrounds[activityIndex % activityBackgrounds.length];

    const content = document.createElement('div');
    content.classList.add('content');

    const activityName = document.createElement('p');
    activityName.classList.add('activity-content');
    activityName.classList.add('activity-name')
    activityName.textContent = formData.get('activityName');

    const activityTime = document.createElement('p');
    activityTime.classList.add('activity-content');
    activityTime.classList.add('activity-time');

    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    const randomColor = colorItems[activityIndex % activityBackgrounds.length];

    activityTime.textContent = `${formData.get('activityTime')}`;
    activityTime.style.color = randomColor;

    /*const activityLocation = document.createElement('p');
    activityLocation.classList.add('activity-content');
    activityLocation.textContent = `地点: ${formData.get('activityLocation')}`;*/

    const activityRules = document.createElement('p');
    activityRules.classList.add('activity-content');
    activityRules.classList.add('activity-desc');
    const ar = document.getElementById('activityRules');
    //activityRules.textContent = `规则: ${formData.get('activityRules')}`;
    activityRules.textContent = ar.value.trim();

    content.appendChild(activityName);
    content.appendChild(activityTime);
    //content.appendChild(activityLocation);
    content.appendChild(activityRules);

    activityCard.appendChild(content);

    document.getElementById('activityList').appendChild(activityCard);

    // 重置表单
    form.reset();

    activityIndex++;


    
}

/*document.getElementById('downloadBtn').addEventListener('click', function () {
    const activityList = document.getElementById('activityList');
    html2canvas(activityList).then(canvas => {
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = 'activity_image.png';
        link.click();
    });
});*/

document.getElementById('downloadBtn').addEventListener('click', function () {
    const node = document.getElementById('activityList');
    domtoimage.toBlob(node)
        .then(function (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'my-image.png'; // 设置下载的文件名
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url); // 释放 URL 对象
        })
        .catch(function (error) {
            console.error('Error occurred:', error);
        });
});



// script.js
/*document.addEventListener('DOMContentLoaded', function () {
    const colorPickerButton = document.getElementById('colorPickerButton');
    const colorPicker = document.getElementById('colorPicker');
    const colorInput = document.getElementById('colorInput');
    const applyColorButton = document.getElementById('applyColorButton');
    const text = document.getElementById('text');

    colorPickerButton.addEventListener('click', function () {
        console.log(colorPicker.classList);
        colorPicker.classList.remove('hidden');
        console.log(colorPicker.classList);
    });

    applyColorButton.addEventListener('click', function () {
        const selectedColor = colorInput.value;
        text.style.color = selectedColor;
        colorPicker.classList.add('hidden');
    });

    // Optionally, you can add a click event outside the color picker to hide it
    document.addEventListener('click', function (event) {
        if (!colorPicker.contains(event.target) && event.target !== colorPickerButton) {
            colorPicker.classList.add('hidden');
        }
    });
});



// script.js
document.addEventListener('DOMContentLoaded', function () {
    const editButtons = document.querySelectorAll('.edit-button');
    const colorPickerDialog = document.getElementById('colorPickerDialog');
    const colorInputDialog = document.getElementById('colorInputDialog');
    const fontSizeInputDialog = document.getElementById('fontSizeInputDialog');
    const applyChangesDialogButton = document.getElementById('applyChangesDialogButton');
    const cancelDialogButton = document.getElementById('cancelDialogButton');

    editButtons.forEach(function (button) {
        button.addEventListener('click', function (event) {
            const targetTextId = button.getAttribute('data-target');
            console.log(targetTextId)
            const targetText = document.getElementById(targetTextId);
            console.log(targetText.style.color);
            // 预设对话框中的颜色和字号为当前文本的值
            //colorInputDialog.value = targetText.style.color || '#000000'; // 如果没有设置颜色，则默认为黑色
            //fontSizeInputDialog.value = targetText.style.fontSize ? parseInt(targetText.style.fontSize, 10) : 16; // 如果没有设置字号，则默认为16px

            console.log(colorPickerDialog.classList);
            // 显示对话框
            colorPickerDialog.classList.remove('hidden');
            console.log(colorPickerDialog.classList);

            // 当点击应用或取消按钮时，设置一个标志来知道是哪个操作触发了事件
            let isApplyingChanges = false;
            applyChangesDialogButton.addEventListener('click', function () {
                isApplyingChanges = true;
                handleDialogClose();
            }, { once: true });

            cancelDialogButton.addEventListener('click', function () {
                handleDialogClose();
            }, { once: true });

            // 点击对话框外部时也关闭对话框（但不在应用或取消时）
            /*document.addEventListener('click', function (dialogClickEvent) {
                if (!colorPickerDialog.contains(dialogClickEvent.target) && !isApplyingChanges) {
                    handleDialogClose();
                }
            }, { once: true }); // 使用{ once: true }来确保事件监听器只触发一次，然后自动移除

            document.addEventListener('click', function (event) {
                if (!colorPickerDialog.contains(event.target) && event.target !== button) {
                    colorPickerDialog.classList.add('hidden');
                }
            });


            function handleDialogClose() {
                console.log("触发关闭");
                colorPickerDialog.classList.add('hidden');

                if (isApplyingChanges) {
                    const selectedColor = colorInputDialog.value;
                    const selectedFontSize = parseInt(fontSizeInputDialog.value, 10);
                    targetText.style.color = selectedColor;
                    targetText.style.fontSize = selectedFontSize + 'px';
                }

                // 移除为应用或取消按钮添加的事件监听器（虽然在这个例子中由于{ once: true }它们已经被自动移除了）
                // 但如果你打算在对话框再次打开时重用这些按钮，你可能需要更复杂的逻辑来管理事件监听器
            }
        });
    });
});*/