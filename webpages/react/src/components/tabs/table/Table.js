import React from 'react'
import './Table.css'

class Table extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            isActive: true,
        };
    }
    render(){
        return <p>This is the table tab !</p>
    }
}

export default Table;