
// function inputPreview(e) {
//    let userInput = e.querySelector('textarea').value;
//     userInput = userInput.replace(/--/g, '<li>')
//     e.querySelector('#preview').innerHTML = userInput;
// }

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
