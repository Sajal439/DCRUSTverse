export type CampusTabParamList = {
  home: undefined;
  academics: undefined;
  'admin-users': undefined;
  'digital-id': undefined;
  tickets: undefined;
  notices: undefined;
  map: undefined;
  bus: undefined;
  ai: undefined;
};

export type CampusRoute = keyof CampusTabParamList;

export type LiveTabParamList = {
  Home: undefined;
  Academics: undefined;
  Services: { resourceKey?: string; openedAt?: number } | undefined;
  Inbox: undefined;
  Profile: undefined;
};
