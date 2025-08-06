import React from 'react';

const businessTypes = [
  'Sole proprietorship',
  'Partnership',
  'Limited liability company (LLC)',
  'Corporation'
];



const LegalInfoStep: React.FC = () => {
  return (
    <div>
      <h1>Legal Info Step</h1>
    </div>
  );
 /** const dispatch = useDispatch();
  const ownershipInfo = useSelector((state: RootState) => state.form.formData.ownershipInfo);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    dispatch(updateOwnershipInfo({ [name]: value }));
  };

  //const [ein, setEin] = useState(companyInfo.ein);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatEIN(e.target.value);
   // setEin(formatted);
    dispatch(updateOwnershipInfo({ ownershipInfo: { ...ownershipInfo, ein: formatted } }));
  };

  const formatEIN = (value: string): string => {
    // Supprime tout ce qui n'est pas chiffre
    const digitsOnly = value.replace(/\D/g, '');

    // Tronque à 9 chiffres max
    const truncated = digitsOnly.slice(0, 9);

    // Formate en XX-XXXXXXX
    if (truncated.length <= 2) {
      return truncated;
    } else if (truncated.length <= 9) {
      return `${truncated.slice(0, 2)}-${truncated.slice(2)}`;
    }

    return truncated;
  };


  return (

    <div className="flex flex-col items-center justify-center w-full">
      <p className="text-gray-600 mb-8 text-2xl font-bold mt-10">Tell us about your business legal information</p>

      <p className="text-gray-400 mb-16 text-center px-20">
        We use your historical ticket sales, 3rd party and proprietary data to determine your advance eligibility in minutes. We only collect the information we need to provide you the best possible offer.
      </p>

      

          <div className="relative w-full max-w-md mb-10">
            <input
              type="text"
              name="companyName"
              value=""
              onChange={handleInputChange}
              className="block w-full p-4 text-sm text-gray-900 rounded-2xl text-gray-500 border-2 border-gray-300 focus:border-rose-300 peer focus:ring-1 focus:ring-rose-500 focus:outline-none" placeholder=" " required
              /><label htmlFor="floating_outlined"
            className="absolute text-sm text-gray-500 bg-white text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] 
             px-2 peer-focus:px-2 peer-focus:text-gray-500 peer-focus:text-rose-500 peer-placeholder-shown:scale-100 
            peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto start-1">Legal Entity Name</label>
        </div>
  
      
          <div className="relative w-full max-w-md mb-10">
            <input
              type="text"
              name="dba"
              value=""
              onChange={handleInputChange}
              className="block w-full p-4 text-sm text-gray-900 rounded-2xl text-gray-500 border-2 border-gray-300 focus:border-rose-300 peer focus:ring-1 focus:ring-rose-500 focus:outline-none" placeholder=" " required
            />
            <label htmlFor="floating_outlined"
            className="absolute text-sm text-gray-500 bg-white text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] 
             px-2 peer-focus:px-2 peer-focus:text-gray-500 peer-focus:text-rose-500 peer-placeholder-shown:scale-100 
            peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto start-1">DBA</label>
          </div>
          <div className="relative w-full max-w-md mb-10">
            <input
              type="text"
              name="companyAddress"
              value={ownershipInfo.companyAddress}
              onChange={handleInputChange}
              className="block w-full p-4 text-sm text-gray-900 rounded-2xl text-gray-500 border-2 border-gray-300 focus:border-rose-300 peer focus:ring-1 focus:ring-rose-500 focus:outline-none" placeholder=" " required
            />
            <label htmlFor="floating_outlined"
            className="absolute text-sm text-gray-500 bg-white text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] 
             px-2 peer-focus:px-2 peer-focus:text-gray-500 peer-focus:text-rose-500 peer-placeholder-shown:scale-100 
            peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto start-1">Legal Entity Address</label>
          </div>
          <div className="relative w-full max-w-md mb-10">
            <input
              type="text"
              name="companyZipCode"
              value={ownershipInfo.companyZipCode}
              onChange={handleInputChange}
              className="block w-full p-4 text-sm text-gray-900 rounded-2xl text-gray-500 border-2 border-gray-300 focus:border-rose-300 peer focus:ring-1 focus:ring-rose-500 focus:outline-none" placeholder=" " required
            />
            <label htmlFor="floating_outlined"
            className="absolute text-sm text-gray-500 bg-white text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] 
             px-2 peer-focus:px-2 peer-focus:text-gray-500 peer-focus:text-rose-500 peer-placeholder-shown:scale-100 
            peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto start-1">Legal Entity ZIP code</label>
          </div>
          <div className="relative w-full max-w-md mb-10">
            <input
              type="text"
              name="companyCity"
              value={ownershipInfo.companyCity}
              onChange={handleInputChange}
              className="block w-full p-4 text-sm text-gray-900 rounded-2xl text-gray-500 border-2 border-gray-300 focus:border-rose-300 peer focus:ring-1 focus:ring-rose-500 focus:outline-none" placeholder=" " required
            />
            <label htmlFor="floating_outlined"
            className="absolute text-sm text-gray-500 bg-white text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] 
             px-2 peer-focus:px-2 peer-focus:text-gray-500 peer-focus:text-rose-500 peer-placeholder-shown:scale-100 
            peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto start-1">Legal Entity City</label>
          </div>

          <div className="relative w-full max-w-md mb-10">
            <select
              name="companyState"
              value={ownershipInfo.companyState}
              onChange={handleInputChange}
              className="block w-full p-4 text-sm text-gray-900 rounded-2xl text-gray-500 border-2 border-gray-300 focus:border-rose-300 peer focus:ring-1 focus:ring-rose-500 focus:outline-none"  required
            >
            <option value="">Select Legal Entity State</option>
              {usStates.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
            <label htmlFor="floating_outlined"
            className="absolute text-sm text-gray-500 bg-white text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] 
             px-2 peer-focus:px-2 peer-focus:text-gray-500 peer-focus:text-rose-500 peer-placeholder-shown:scale-100 
            peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto start-1">Legal Entity State</label>
          </div>


          <div className="relative w-full max-w-md mb-10">
            <select
              name="legalEntityType"
              value={ownershipInfo.legalEntityType}
              onChange={handleInputChange}
              className="block w-full p-4 text-sm text-gray-900 rounded-2xl text-gray-500 border-2 border-gray-300 focus:border-rose-300 peer focus:ring-1 focus:ring-rose-500 focus:outline-none"  required
            >
              <option value="">Select Legal Entity Type</option>
              {businessTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <label htmlFor="floating_outlined"
            className="absolute text-sm text-gray-500 bg-white text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] 
             px-2 peer-focus:px-2 peer-focus:text-gray-500 peer-focus:text-rose-500 peer-placeholder-shown:scale-100 
            peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto start-1">Legal Entity Type</label>
          </div>

          <div className="relative w-full max-w-md mb-10">
            <input
              type="text"
              name="ein"
              value={ein}
              onChange={handleChange}
              placeholder="Tax ID (EIN)"
              maxLength={10} // 9 chiffres + 1 tiret

              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
 


  );
 */
};

export default LegalInfoStep;   