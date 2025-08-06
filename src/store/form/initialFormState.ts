import { FormState } from './formTypes';

export const initialState: FormState = {
  currentStep: 1,
  email: '',
  emailError: '',
  isSubmitted: false,
  formData: {
    personalInfo: { email: '', emailConfirm: '', firstname: '', lastname: '', phone: '' },
    companyInfo: {  
      employees: 0, name: '', dba: '', yearsInBusiness: '', socials: '', companyType: '',
      legalEntityType: '', companyAddress: '', role: '',
       ein: '', stateOfIncorporation: '', membership: ''
    },
    fundsInfo: {  
        yourFunds: '', fundUse: '', timeForFunding: ''
    },
    ownershipInfo: {
     owners: [],
      } ,
    financesInfo: {
      singleEntity: true, assetsTransferred: false, filedLastYearTaxes: false, lastYearTaxes: [], hasBusinessDebt: false,     
      debts: [], hasOverdueLiabilities: false, isLeasingLocation: false,
      leaseEndDate: '', hasTaxLiens: false, hasJudgments: false,
      hasBankruptcy: false, ownershipChanged: false,
      industryReferences: '',
      additionalComments: '',
    },
  },
  
  diligenceInfo: {    
    financialStatements: { files: [], fileInfos: [] },
    bankStatement: { files: [], fileInfos: [] },    
    incorporationCertificate: { files: [], fileInfos: [] },
    legalEntityChart: { files: [], fileInfos: [] },
    governmentId: { files: [], fileInfos: [] },
    w9form: { files: [], fileInfos: [] },
    lastYearTaxes: { files: [], fileInfos: [] },
    other: { files: [], fileInfos: [] },
  } 
};
