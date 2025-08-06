export interface Address {
  street: string;
  city: string;
  zipcode: string;
  state: string;
  country: string;
}

export interface Owner {
  id: string;
  ownerName: string;
  ownershipPercentage: string;
  sameAddress: boolean;
  ownerAddress: string;
  ownerBirthDate: string;
}

export interface FileInfo {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
}

export interface DiligenceFileData {
  files: File[];
  fileInfos: FileInfo[];
}

export interface FormState {
  currentStep: number;
  email: string;
  emailError: string;
  isSubmitted: boolean;
  formData: {
    personalInfo: {
      email: string;
      emailConfirm: string;
      firstname: string;
      lastname: string;
      phone: string;
    };
    companyInfo: {
      employees: number;
      name: string;
      dba: string;
      yearsInBusiness: string;
      socials: string;
      companyType: string;
      legalEntityType: string;
      companyAddress: string;
      role: string;
      ein: string;
      stateOfIncorporation: string;
      membership: string;
    };
    fundsInfo: {
      yourFunds: string;
      fundUse: string;
      timeForFunding: string;
    };
    ownershipInfo: {
      owners: Owner[];
    };
    financesInfo: {
      singleEntity: boolean;
      assetsTransferred: boolean;
      filedLastYearTaxes: boolean;
      lastYearTaxes: FileInfo[];
      hasBusinessDebt: boolean;
      debts: Array<{
        type: string;
        balance: string;
      }>;
      hasOverdueLiabilities: boolean;
      isLeasingLocation: boolean;
      leaseEndDate: string;
      hasTaxLiens: boolean;
      hasJudgments: boolean;
      hasBankruptcy: boolean;
      ownershipChanged: boolean;
      industryReferences: string;
      additionalComments: string;
    };
  };

  diligenceInfo: {
    financialStatements: DiligenceFileData;
    bankStatement: DiligenceFileData;
    incorporationCertificate: DiligenceFileData;
    legalEntityChart: DiligenceFileData;
    governmentId: DiligenceFileData;
    w9form: DiligenceFileData;
    lastYearTaxes: DiligenceFileData;
    other: DiligenceFileData;
  };
}
  