import React from 'react';
import './Info.css';

function Description(props){
    return(
        <div className="description">
            <p className="descriptionHeader">Description : </p>
            <div className="descriptionText">{props.value}</div>
        </div>
    );
}
function Reference(props){
    return(
        <div className="reference">
            <p className="referenceHeader">Reference : </p>
            <div className="referenceText">{props.value}</div>
        </div>
    )
}

class Info extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            isActive:  true,
        };
    }
    render(){
        return(
            <div className = "info">
                <Reference value={this.props.reference}/>
                <Description value={this.props.description}/>
            </div>
        );
    }
}

export default Info;