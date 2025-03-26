import cds, { Request } from '@sap/cds';
console.log("✅ service.ts is geladen!");

export default async function (srv: any) {
    const { Colleagues, Followups } = srv.entities;

    if (!Colleagues || !Followups) {
        console.error("Colleagues of Followup entity niet gevonden!");
        return;
    }

    srv.before(['CREATE', 'UPDATE', 'PATCH'], 'Colleagues', async (req: Request) => {
        console.log("🚀 PATCH wordt uitgevoerd op Colleagues!");
        console.log("📊 Inkomende data:", req.data);
    
        const { frequency_level } = req.data as { frequency_level?: string };
    
        const validLevels = ["Low", "Medium", "High"];
        if (frequency_level !== undefined && !validLevels.includes(frequency_level)) {
            req.reject(400, "frequency_level moet 'Low', 'Medium' of 'High' zijn.");
        }
    });
    
    // CREATE - Nieuwe collega aanmaken
    srv.on('CREATE', 'Colleagues', async (req: Request) => {
        const { first_name, last_name, email, phone_number, last_time_called, frequency_level, status } = req.data as any;
    
        if (!first_name || !last_name || !email || frequency_level === undefined) {
            return req.reject(400, "Vereiste velden ontbreken: first_name, last_name, email en frequency_level zijn verplicht.");
        }
    
        const validLevels = ["Low", "Medium", "High"];
        if (!validLevels.includes(frequency_level)) {
            return req.reject(400, "frequency_level moet 'Low', 'Medium' of 'High' zijn.");
        }
    
        const newColleague = {
            colleague_id: cds.utils.uuid(),
            first_name,
            last_name,
            email,
            phone_number,
            last_time_called,
            frequency_level,
            status
        };
    
        await cds.transaction(req).run(INSERT.into(Colleagues).entries(newColleague));
    
        return await cds.transaction(req).run(SELECT.one.from(Colleagues).where({ colleague_id: newColleague.colleague_id }));
    });
    
    // UPDATE - Collega updaten (PATCH)
    srv.on('PATCH', 'Colleagues', async (req: Request) => {
        const { colleague_id, frequency_level } = req.data as { colleague_id: string; frequency_level?: string };
    
        if (!colleague_id) {
            return req.reject(400, "colleague_id is verplicht voor updates.");
        }
    
        const validLevels = ["Low", "Medium", "High"];
        if (frequency_level !== undefined && !validLevels.includes(frequency_level)) {
            return req.reject(400, "frequency_level moet 'Low', 'Medium' of 'High' zijn.");
        }
    
        const existingColleague = await cds.transaction(req).run(SELECT.one.from(Colleagues).where({ colleague_id }));
    
        if (!existingColleague) {
            return req.reject(404, "Collega niet gevonden.");
        }
    
        await cds.transaction(req).run(UPDATE(Colleagues).set(req.data).where({ colleague_id }));
    
        return await cds.transaction(req).run(SELECT.one.from(Colleagues).where({ colleague_id }));
    });
    
    // DELETE - Collega verwijderen
    srv.on('DELETE', 'Colleagues', async (req: Request) => {
        const { colleague_id } = req.data as { colleague_id: string };
    
        if (!colleague_id) {
            return req.reject(400, "colleague_id is verplicht om te verwijderen.");
        }
    
        const existingColleague = await cds.transaction(req).run(SELECT.one.from(Colleagues).where({ colleague_id }));
    
        if (!existingColleague) {
            return req.reject(404, "Collega niet gevonden.");
        }
    
        await cds.transaction(req).run(DELETE.from(Colleagues).where({ colleague_id }));
    
        return { message: "Collega succesvol verwijderd." };
    });
    





    //FOLLOW-UPS

    // ✅ BEFORE HOOK voor validatie van 'Followup'
   // BEFORE HOOK voor validatie van 'Followup'
    srv.before('CREATE', 'Followups', async (req: Request) => {
        const { followup_message, date } = req.data as { followup_message?: string; date?: string };

        if (!followup_message || followup_message.trim() === "") {
            req.reject(400, "followup_message mag niet leeg zijn.");
        }

        if (!date) {
            req.reject(400, "date is verplicht bij aanmaken.");
        }
    });




    srv.on('CREATE', 'Followups', async (req: Request) => {
        console.log("🚀 Ontvangen data:", req.data);
        const { followup_message, date, user_id, colleague_id } = req.data as any;
    
        if (!followup_message || !date || !user_id || !colleague_id) {
            console.log("❌ Fout: Vereiste velden ontbreken!");
            return req.reject(400, "Vereiste velden ontbreken: followup_message, date, user_id en colleague_id zijn verplicht.");
        }
    
        // ✅ Haal de juiste entities op uit de service
        const { Users, Colleagues, Followups } = srv.entities;
    
        // ✅ Correct ophalen van de UUID van de associaties
        const userUUID = user_id?.user_id;
        const colleagueUUID = colleague_id?.colleague_id;
    
        if (!userUUID || !colleagueUUID) {
            console.log("❌ Fout: De user_id of colleague_id ontbreekt in het request.");
            return req.reject(400, "user_id en colleague_id moeten correct worden opgegeven.");
        }
    
        console.log(`🔍 Validatie: Gebruiker ${userUUID} en Collega ${colleagueUUID}`);
    
        // ✅ Correcte database-query (gebruik de opgehaalde entities)
        const userExists = await cds.transaction(req).run(SELECT.one.from(Users).where({ user_id: userUUID }));
        if (!userExists) {
            console.log(`❌ Fout: Gebruiker ${userUUID} bestaat niet.`);
            return req.reject(400, `Gebruiker met ID ${userUUID} bestaat niet.`);
        }
    
        const colleagueExists = await cds.transaction(req).run(SELECT.one.from(Colleagues).where({ colleague_id: colleagueUUID }));
        if (!colleagueExists) {
            console.log(`❌ Fout: Collega ${colleagueUUID} bestaat niet.`);
            return req.reject(400, `Collega met ID ${colleagueUUID} bestaat niet.`);
        }
    
        console.log("✅ Gevalideerde data, followup wordt aangemaakt.");
    
        const newFollowup = {
            followup_id: cds.utils.uuid(),
            followup_message,
            date,
            user_id: { user_id: userUUID },  // 🔹 Correct als associatie-object
            colleague_id: { colleague_id: colleagueUUID } // 🔹 Correct als associatie-object
        };
    
        await cds.transaction(req).run(INSERT.into(Followups).entries(newFollowup));
    
        return await cds.transaction(req).run(SELECT.one.from(Followups).where({ followup_id: newFollowup.followup_id }));
    });
    
            
    

    // ✅ PATCH Followup (Update)
    srv.on('PATCH', 'Followups', async (req: Request) => {
        console.log("🚀 Ontvangen update-data:", req.data);
    
        const { followup_id } = req.data as { followup_id: string };
        if (!followup_id) {
            return req.reject(400, "followup_id is verplicht voor updates.");
        }
    
        const { Followups } = srv.entities;
        
        const existingFollowup = await cds.transaction(req).run(SELECT.one.from(Followups).where({ followup_id }));
        if (!existingFollowup) {
            return req.reject(404, "Follow-up niet gevonden.");
        }
    
        // ✅ Voer de update uit
        await cds.transaction(req).run(UPDATE(Followups).set(req.data).where({ followup_id }));
    
        // ✅ Retourneer de geüpdatete Followup
        return await cds.transaction(req).run(SELECT.one.from(Followups).where({ followup_id }));
    });
    

    // ✅ DELETE Followup
    srv.on('DELETE', 'Followups', async (req: Request) => {
        const { followup_id } = req.data as { followup_id: string };

        if (!followup_id) {
            return req.reject(400, "followup_id is verplicht om te verwijderen.");
        }

        const existingFollowup = await cds.transaction(req).run(SELECT.one.from(Followups).where({ followup_id }));

        if (!existingFollowup) {
            return req.reject(404, "Follow-up niet gevonden.");
        }

        await cds.transaction(req).run(DELETE.from(Followups).where({ followup_id }));

        return { message: "Follow-up succesvol verwijderd." };
    });







    // EVENTS

    // CREATE Events
    srv.on('CREATE', 'Events', async (req: Request) => {
        console.log("🚀 Ontvangen event data:", req.data);

        const { event_name, event_description, event_date, event_hour } = req.data as any;

        if (!event_name || !event_description || !event_date || !event_hour) {
            return req.reject(400, "Vereiste velden ontbreken: event_name, event_description, event_date en event_hour zijn verplicht.");
        }

        const newEvent = {
            event_id: cds.utils.uuid(),
            event_name,
            event_description,
            event_date,
            event_hour
        };

        await cds.transaction(req).run(INSERT.into('Events').entries(newEvent));

        return await cds.transaction(req).run(SELECT.one.from('Events').where({ event_id: newEvent.event_id }));
    });


    // PATCH Events
    srv.on('PATCH', 'Events', async (req: Request) => {
        console.log("🚀 Ontvangen update-event data:", req.data);
    
        const { event_id } = req.data as { event_id: string };
        if (!event_id) {
            return req.reject(400, "event_id is verplicht voor updates.");
        }
    
        const { Events } = srv.entities;
    
        const existingEvent = await cds.transaction(req).run(SELECT.one.from(Events).where({ event_id }));
        if (!existingEvent) {
            return req.reject(404, "Event niet gevonden.");
        }
    
        await cds.transaction(req).run(UPDATE(Events).set(req.data).where({ event_id }));
    
        return await cds.transaction(req).run(SELECT.one.from(Events).where({ event_id }));
    });


    // DELETE Events
    srv.on('DELETE', 'Events', async (req: Request) => {
        console.log("🚀 Ontvangen delete-request voor event:", req.data);
    
        const { event_id } = req.data as { event_id: string };
        if (!event_id) {
            return req.reject(400, "event_id is verplicht om te verwijderen.");
        }
    
        const { Events } = srv.entities;
    
        const existingEvent = await cds.transaction(req).run(SELECT.one.from(Events).where({ event_id }));
        if (!existingEvent) {
            return req.reject(404, "Event niet gevonden.");
        }
    
        await cds.transaction(req).run(DELETE.from(Events).where({ event_id }));
    
        return { message: "Event succesvol verwijderd." };
    });




    // TAG

    // ✅ CREATE Tag
    srv.on('CREATE', 'Tags', async (req: Request) => {
        console.log("🚀 Ontvangen tag-data:", req.data);

        const { tag_name, tag_description } = req.data as any;

        if (!tag_name || tag_name.trim() === "") {
            return req.reject(400, "tag_name is verplicht.");
        }

        const newTag = {
            tag_id: cds.utils.uuid(),
            tag_name,
            tag_description
        };

        await cds.transaction(req).run(INSERT.into('Tags').entries(newTag));

        return await cds.transaction(req).run(SELECT.one.from('Tags').where({ tag_id: newTag.tag_id }));
    });

    // ✅ PATCH Tag (UPDATE)
    srv.on('PATCH', 'Tags', async (req: Request) => {
        console.log("🚀 Ontvangen update-tag data:", req.data);

        const { tag_id } = req.data as { tag_id: string };
        if (!tag_id) {
            return req.reject(400, "tag_id is verplicht voor updates.");
        }

        const { Tags } = srv.entities;

        const existingTag = await cds.transaction(req).run(SELECT.one.from(Tags).where({ tag_id }));
        if (!existingTag) {
            return req.reject(404, "Tag niet gevonden.");
        }

        await cds.transaction(req).run(UPDATE(Tags).set(req.data).where({ tag_id }));

        return await cds.transaction(req).run(SELECT.one.from(Tags).where({ tag_id }));
    });

    // ✅ DELETE Tag
    srv.on('DELETE', 'Tags', async (req: Request) => {
        console.log("🚀 Ontvangen delete-request voor tag:", req.data);

        const { tag_id } = req.data as { tag_id: string };
        if (!tag_id) {
            return req.reject(400, "tag_id is verplicht om te verwijderen.");
        }

        const { Tags } = srv.entities;

        const existingTag = await cds.transaction(req).run(SELECT.one.from(Tags).where({ tag_id }));
        if (!existingTag) {
            return req.reject(404, "Tag niet gevonden.");
        }

        await cds.transaction(req).run(DELETE.from(Tags).where({ tag_id }));

        return { message: "Tag succesvol verwijderd." };
    });


    // USER_FOLLOWED_COLLEAGUE

    // ✅ CREATE User_Followed_Colleague (Gebruiker volgt een collega)
    srv.on('CREATE', 'User_Followed_Colleagues', async (req: Request) => {
        console.log("🚀 Ontvangen follow-data:", req.data);

        const { user_id, colleague_id } = req.data as any;

        if (!user_id || !colleague_id) {
            return req.reject(400, "user_id en colleague_id zijn verplicht.");
        }

        const { Users, Colleagues, User_Followed_Colleagues } = srv.entities;

        // ✅ Controleer of user_id en colleague_id bestaan
        const userExists = await cds.transaction(req).run(SELECT.one.from(Users).where({ user_id }));
        if (!userExists) {
            return req.reject(400, `Gebruiker met ID ${user_id} bestaat niet.`);
        }

        const colleagueExists = await cds.transaction(req).run(SELECT.one.from(Colleagues).where({ colleague_id }));
        if (!colleagueExists) {
            return req.reject(400, `Collega met ID ${colleague_id} bestaat niet.`);
        }

        console.log(`✅ Validatie geslaagd: Gebruiker ${user_id} volgt Collega ${colleague_id}`);

        const newFollow = {
            id: cds.utils.uuid(),
            user_id,
            colleague_id
        };

        await cds.transaction(req).run(INSERT.into(User_Followed_Colleagues).entries(newFollow));

        return await cds.transaction(req).run(SELECT.one.from(User_Followed_Colleagues).where({ id: newFollow.id }));
    });

    // ✅ DELETE User_Followed_Colleague (Gebruiker ontvolgt een collega)
    srv.on('DELETE', 'User_Followed_Colleagues', async (req: Request) => {
        console.log("🚀 Ontvangen delete-request voor follow:", req.data);

        const { id } = req.data as { id: string };
        if (!id) {
            return req.reject(400, "id is verplicht om een follow-verwijdering uit te voeren.");
        }

        const { User_Followed_Colleagues } = srv.entities;

        const existingFollow = await cds.transaction(req).run(SELECT.one.from(User_Followed_Colleagues).where({ id }));
        if (!existingFollow) {
            return req.reject(404, "Deze follow-relatie bestaat niet.");
        }

        await cds.transaction(req).run(DELETE.from(User_Followed_Colleagues).where({ id }));

        return { message: "Gebruiker is succesvol ontvolgd." };
    });

    // TAGS_COLLEAGUES

    // CREATE
    srv.on('CREATE', 'Tags_Colleagues', async (req: Request) => {
        console.log("🚀 Ontvangen data voor tag-collega koppeling:", req.data);
    
        const { colleague_id, tag_id } = req.data as any;
    
        if (!colleague_id || !tag_id) {
            return req.reject(400, "colleague_id en tag_id zijn verplicht.");
        }
    
        const { Colleagues, Tags, Tags_Colleagues } = srv.entities;
    
        // ✅ Controleer of de collega en tag bestaan
        const colleagueExists = await cds.transaction(req).run(SELECT.one.from(Colleagues).where({ colleague_id }));
        if (!colleagueExists) {
            return req.reject(400, `Collega met ID ${colleague_id} bestaat niet.`);
        }
    
        const tagExists = await cds.transaction(req).run(SELECT.one.from(Tags).where({ tag_id }));
        if (!tagExists) {
            return req.reject(400, `Tag met ID ${tag_id} bestaat niet.`);
        }
    
        console.log(`✅ Validatie geslaagd: Tag ${tag_id} wordt gekoppeld aan Collega ${colleague_id}`);
    
        const newTagColleague = {
            id: cds.utils.uuid(),
            colleague_id,
            tag_id
        };
    
        await cds.transaction(req).run(INSERT.into(Tags_Colleagues).entries(newTagColleague));
    
        return await cds.transaction(req).run(SELECT.one.from(Tags_Colleagues).where({ id: newTagColleague.id }));
    });

    // DELETE
    srv.on('DELETE', 'Tags_Colleagues', async (req: Request) => {
        console.log("🚀 Ontvangen delete-request voor tag-collega koppeling:", req.data);
    
        const { id } = req.data as { id: string };
        if (!id) {
            return req.reject(400, "id is verplicht om een tag-koppeling te verwijderen.");
        }
    
        const { Tags_Colleagues } = srv.entities;
    
        const existingTagColleague = await cds.transaction(req).run(SELECT.one.from(Tags_Colleagues).where({ id }));
        if (!existingTagColleague) {
            return req.reject(404, "Deze tag-koppeling bestaat niet.");
        }
    
        await cds.transaction(req).run(DELETE.from(Tags_Colleagues).where({ id }));
    
        return { message: "Tag is succesvol van collega verwijderd." };
    });
    
    

    //COLLEAGUE_EVENT

    //CREATE
    srv.on('CREATE', 'Colleague_Events', async (req: Request) => {
        console.log("🚀 Ontvangen data voor collega-event koppeling:", req.data);
    
        const { colleague_id, event_id, presence } = req.data as any;
    
        if (!colleague_id || !event_id || presence === undefined) {
            return req.reject(400, "colleague_id, event_id en presence zijn verplicht.");
        }
    
        const { Colleagues, Events, Colleague_Events } = srv.entities;
    
        // ✅ Controleer of de collega en het event bestaan
        const colleagueExists = await cds.transaction(req).run(SELECT.one.from(Colleagues).where({ colleague_id }));
        if (!colleagueExists) {
            return req.reject(400, `Collega met ID ${colleague_id} bestaat niet.`);
        }
    
        const eventExists = await cds.transaction(req).run(SELECT.one.from(Events).where({ event_id }));
        if (!eventExists) {
            return req.reject(400, `Event met ID ${event_id} bestaat niet.`);
        }
    
        console.log(`✅ Validatie geslaagd: Collega ${colleague_id} wordt gekoppeld aan Event ${event_id}`);
    
        const newColleagueEvent = {
            id: cds.utils.uuid(),
            colleague_id,
            event_id,
            presence
        };
    
        await cds.transaction(req).run(INSERT.into(Colleague_Events).entries(newColleagueEvent));
    
        return await cds.transaction(req).run(SELECT.one.from(Colleague_Events).where({ id: newColleagueEvent.id }));
    });

    //PATCH
    srv.on('PATCH', 'Colleague_Events', async (req: Request) => {
        console.log("🚀 Ontvangen update voor collega-event koppeling:", req.data);
    
        const { id, presence } = req.data as { id: string; presence?: boolean };
    
        if (!id) {
            return req.reject(400, "id is verplicht voor updates.");
        }
    
        if (presence === undefined) {
            return req.reject(400, "presence is verplicht bij het bijwerken.");
        }
    
        const { Colleague_Events } = srv.entities;
    
        const existingColleagueEvent = await cds.transaction(req).run(SELECT.one.from(Colleague_Events).where({ id }));
        if (!existingColleagueEvent) {
            return req.reject(404, "Deze collega-event koppeling bestaat niet.");
        }
    
        await cds.transaction(req).run(UPDATE(Colleague_Events).set({ presence }).where({ id }));
    
        return await cds.transaction(req).run(SELECT.one.from(Colleague_Events).where({ id }));
    });
    

    //DELETE
    srv.on('DELETE', 'Colleague_Events', async (req: Request) => {
        console.log("🚀 Ontvangen delete-request voor collega-event koppeling:", req.data);
    
        const { id } = req.data as { id: string };
    
        if (!id) {
            return req.reject(400, "id is verplicht om een collega uit een event te verwijderen.");
        }
    
        const { Colleague_Events } = srv.entities;
    
        const existingColleagueEvent = await cds.transaction(req).run(SELECT.one.from(Colleague_Events).where({ id }));
        if (!existingColleagueEvent) {
            return req.reject(404, "Deze collega-event koppeling bestaat niet.");
        }
    
        await cds.transaction(req).run(DELETE.from(Colleague_Events).where({ id }));
    
        return { message: "Collega is succesvol uit het event verwijderd." };
    });
    
    

}
