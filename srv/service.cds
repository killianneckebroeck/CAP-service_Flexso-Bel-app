using Bel_app from '../db/schema';

service MyService {
  entity Colleagues as projection on Bel_app.Colleague;
  entity Users as projection on Bel_app.User;
  entity Followups as projection on Bel_app.Followup;
  entity Events as projection on Bel_app.Event;
  entity Colleague_Events as projection on Bel_app.Colleague_Event;
  entity Tags as projection on Bel_app.Tag;
  entity Tags_Colleagues as projection on Bel_app.Tags_Colleagues;
  entity User_Followed_Colleagues as projection on Bel_app.User_Followed_Colleague;
}