import React from 'react';
import MedicalBlockchainApp from '../components/MedicalBlockchainApp ';
import Header from '../components/common/Header';
import PatientDashboard from '../components/patient/PatientDashboard';

const Public = () => {
   return (
      <div>
         <Header></Header>
         <PatientDashboard></PatientDashboard>
      </div>
   );
};

export default Public;