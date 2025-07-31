import { useEffect } from 'react';
import Header from '../components/common/Header';
import PatientDashboard from '../components/patient/PatientDashboard';

const Public = () => {
   useEffect(() => {
      document.title = "Medical Blockchain - Public Dashboard";
   }, []);
   return (
      <div>
         <Header></Header>
         <PatientDashboard></PatientDashboard>
      </div>
   );
};

export default Public;