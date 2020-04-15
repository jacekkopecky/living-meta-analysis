import React from 'react';
import ReactDOM from 'react-dom';

console.log("salut");

function HelloWorld(){
    return(
        <h1>Hello Guys</h1>
    );
}

ReactDOM.render(<HelloWorld />, document.querySelector("#root"));