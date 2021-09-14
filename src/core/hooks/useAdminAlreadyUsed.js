import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import queryString from 'query-string';

function useAdminAlreadyUsed() {
  const [adminAlreadyUsed, setAdminAlreadyUsed] = useState(null);

  const isLoading = useMemo(() => {
    return adminAlreadyUsed === null;
  }, [adminAlreadyUsed]);

  useEffect(() => {
    if (adminAlreadyUsed === null && !adminAlreadyUsed) {
      axios.get(queryString.stringifyUrl({ url: '/admin/already-used' }))
        .then(({ status }) => {
          if (status === 200) {
            setAdminAlreadyUsed(false);
          }
        })
        .catch(error => {
          setAdminAlreadyUsed(true);
          if (error?.response?.status === 409){
            window.alert('La page administrateur est déjà utilisée !');
          }
        })
    }
  }, [adminAlreadyUsed]);

  return { adminAlreadyUsed, isLoading };
}

export default useAdminAlreadyUsed;