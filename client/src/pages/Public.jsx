import React from 'react';
import MedicalBlockchainApp from '../components/MedicalBlockchainApp ';
import Header from '../components/Header';
import PatientDashboard from '../components/PatientDashboard';

const Public = () => {
   return (
      <div>
         <Header></Header>
         <PatientDashboard></PatientDashboard>
      </div>
   );
};

export default Public;