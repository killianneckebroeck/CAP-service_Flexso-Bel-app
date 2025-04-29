namespace Bel_app;

entity Colleague
{
    key colleague_id : UUID;
    first_name : String(100) not null;
    last_name : String(100) not null;
    email : String(100) not null;
    phone_number : String(100);
    last_time_called : DateTime;
    frequency_level : String(10) not null;
    status : String(100);
}

entity User
{
    key user_id : UUID;
    first_name : String(100) not null;
    last_name : String(100) not null;
    email : String(100) not null;
    phone_number : String(100);
    password : String(100);
    last_time_called : DateTime;
}

entity Followup
{
    key followup_id : UUID;
    followup_message : String(3000);
    date : DateTime not null;
    user_id : Association to one User;
    colleague_id : Association to one Colleague;
}

entity Event
{
    key event_id : UUID;
    event_name : String(200) not null;
    event_description : String(1500) not null;
    event_date : Date not null;
    event_hour : Time not null;
}

entity Tag
{
    key tag_id : UUID;
    tag_name : String(150);
    tag_description : String(1500);
}

entity User_Followed_Colleague
{
    key id : UUID;
    colleague_id : Association to one Colleague;
    user_id : Association to one User;
}

entity Tags_Colleagues
{
    key id : UUID;
    colleague_id : Association to one Colleague;
    tag_id : Association to one Tag;
}

entity Colleague_Event
{
    key id : UUID;
    presence : Boolean;
    colleague_id : Association to one Colleague;
    event_id : Association to one Event;
}
