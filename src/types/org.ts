export interface Province {
  id: number;
  name: string;
  code: string;
  country: string;
}

export interface Diocese {
  id: number;
  name: string;
  code: string;
  province_id: number;
}

export interface Parish {
  id: number;
  name: string;
  city: string;
  address: string;
  diocese_id: number;
}
