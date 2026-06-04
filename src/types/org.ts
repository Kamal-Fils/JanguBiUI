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
  // Le back (DioceseOutputSerializer) renvoie la FK sous la clé `province`
  // (+ `province_name`).
  province: number;
  province_name?: string;
}

export interface Parish {
  id: number;
  name: string;
  city: string;
  address: string;
  // Le back (ParishOutputSerializer) renvoie la FK sous la clé `diocese`
  // (+ `diocese_name`). On garde `diocese_id` toléré pour les anciens mocks.
  diocese?: number;
  diocese_id?: number;
  diocese_name: string;
}

export interface Church {
  id: number;
  name: string;
  is_main: boolean;
  city: string;
  is_active: boolean;
  parish: number;
  parish_name: string;
}
