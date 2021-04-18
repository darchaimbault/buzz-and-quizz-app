import React from "react";

import './styles/modalRoute.scss';

function ModalRoute(props) {
  return (
    <div className="modal-container">
      <div className="modal">
        {props.children}
      </div>
    </div>
  );
};

export default ModalRoute;