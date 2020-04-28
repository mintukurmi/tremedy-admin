
function togglePreview(e){

    let userInput = e.querySelector('textarea').value;
    userInput = userInput.replace(/--/g, '<li>')
    e.querySelector('#preview').innerHTML = userInput;

    const ispreviewOn = e.querySelector('#preview').style.display === 'none' ? false : true ;

    if(ispreviewOn){
        e.querySelector('#preview-btn').style.display = 'block';
        e.querySelector('#editor-btn').style.display = 'none';
        e.querySelector('textarea').style.display = 'block';
        e.querySelector('#preview').style.display = 'none';
    }else{
        e.querySelector('#editor-btn').style.display = 'block';
        e.querySelector('#preview-btn').style.display = 'none';
        e.querySelector('textarea').style.display = 'none';
        e.querySelector('#preview').style.display = 'block';
    }
    
    
}


const newPass = document.querySelector('#newPassword');
const currentPass = document.querySelector('#currentPassword');
const avatar = document.querySelector('#avatarChange');
const submitBtn = document.querySelector('#submitBtn');

function getChanges() {
    if ((!newPass.value && !currentPass.value) || !avatar.value) {
        submitBtn.setAttribute('disabled', '')
    }

    if ((newPass.value && currentPass.value) || avatar.value) {
        submitBtn.removeAttribute('disabled')
    }
}

newPass.addEventListener('input', function (e) {

    if (newPass.value) {
        currentPass.setAttribute('required', '')
    } else {
        currentPass.removeAttribute('required')
    }

    getChanges()
})

currentPass.addEventListener('input', () => {

    if (currentPass.value) {
        newPass.setAttribute('required', '')
    } else {
        newPass.removeAttribute('required')
    }

    getChanges()

})

let loadFile = function (event) {
    var output = document.getElementById('avatarImg');
    output.src = URL.createObjectURL(event.target.files[0]);
    output.onload = function () {
        URL.revokeObjectURL(output.src) // free memory
    }
    getChanges()
};