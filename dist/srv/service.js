"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const cds_1 = __importDefault(require("@sap/cds"));
function default_1(srv) {
    return __awaiter(this, void 0, void 0, function* () {
        const { Colleagues, Followups } = srv.entities;
        if (!Colleagues || !Followups) {
            console.error("Colleagues of Followup entity niet gevonden!");
            return;
        }
        srv.before(['CREATE', 'UPDATE'], 'Colleagues', (req) => __awaiter(this, void 0, void 0, function* () {
            const { frequency_level } = req.data;
            if (frequency_level !== undefined && (frequency_level < 0 || frequency_level > 4)) {
                req.reject(400, "frequency_level moet tussen 0 en 4 liggen.");
            }
        }));
        // CREATE - Nieuwe collega aanmaken
        srv.on('CREATE', 'Colleagues', (req) => __awaiter(this, void 0, void 0, function* () {
            const { first_name, last_name, email, phone_number, last_time_called, frequency_level, status } = req.data;
            if (!first_name || !last_name || !email || frequency_level === undefined) {
                return req.reject(400, "Vereiste velden ontbreken: first_name, last_name, email en frequency_level zijn verplicht.");
            }
            if (frequency_level < 0 || frequency_level > 4) {
                return req.reject(400, "frequency_level moet tussen 0 en 4 liggen.");
            }
            const newColleague = {
                colleague_id: cds_1.default.utils.uuid(),
                first_name,
                last_name,
                email,
                phone_number,
                last_time_called,
                frequency_level,
                status
            };
            yield cds_1.default.transaction(req).run(INSERT.into(Colleagues).entries(newColleague));
            return yield cds_1.default.transaction(req).run(SELECT.one.from(Colleagues).where({ colleague_id: newColleague.colleague_id }));
        }));
        // UPDATE - Collega updaten (PATCH)
        srv.on('PATCH', 'Colleagues', (req) => __awaiter(this, void 0, void 0, function* () {
            const { colleague_id, frequency_level } = req.data;
            if (!colleague_id) {
                return req.reject(400, "colleague_id is verplicht voor updates.");
            }
            if (frequency_level !== undefined && (frequency_level < 0 || frequency_level > 4)) {
                return req.reject(400, "frequency_level moet tussen 0 en 4 liggen.");
            }
            const existingColleague = yield cds_1.default.transaction(req).run(SELECT.one.from(Colleagues).where({ colleague_id }));
            if (!existingColleague) {
                return req.reject(404, "Collega niet gevonden.");
            }
            yield cds_1.default.transaction(req).run(UPDATE(Colleagues).set(req.data).where({ colleague_id }));
            return yield cds_1.default.transaction(req).run(SELECT.one.from(Colleagues).where({ colleague_id }));
        }));
        // DELETE - Collega verwijderen
        srv.on('DELETE', 'Colleagues', (req) => __awaiter(this, void 0, void 0, function* () {
            const { colleague_id } = req.data;
            if (!colleague_id) {
                return req.reject(400, "colleague_id is verplicht om te verwijderen.");
            }
            const existingColleague = yield cds_1.default.transaction(req).run(SELECT.one.from(Colleagues).where({ colleague_id }));
            if (!existingColleague) {
                return req.reject(404, "Collega niet gevonden.");
            }
            yield cds_1.default.transaction(req).run(DELETE.from(Colleagues).where({ colleague_id }));
            return { message: "Collega succesvol verwijderd." };
        }));
        //FOLLOW-UPS
        // ✅ BEFORE HOOK voor validatie van 'Followup'
        // BEFORE HOOK voor validatie van 'Followup'
        srv.before('CREATE', 'Followups', (req) => __awaiter(this, void 0, void 0, function* () {
            const { followup_message, date } = req.data;
            if (!followup_message || followup_message.trim() === "") {
                req.reject(400, "followup_message mag niet leeg zijn.");
            }
            if (!date) {
                req.reject(400, "date is verplicht bij aanmaken.");
            }
        }));
        srv.on('CREATE', 'Followups', (req) => __awaiter(this, void 0, void 0, function* () {
            console.log("🚀 Ontvangen data:", req.data);
            const { followup_message, date, user_id, colleague_id } = req.data;
            if (!followup_message || !date || !user_id || !colleague_id) {
                console.log("❌ Fout: Vereiste velden ontbreken!");
                return req.reject(400, "Vereiste velden ontbreken: followup_message, date, user_id en colleague_id zijn verplicht.");
            }
            // ✅ Haal de juiste entities op uit de service
            const { Users, Colleagues, Followups } = srv.entities;
            // ✅ Correct ophalen van de UUID van de associaties
            const userUUID = user_id === null || user_id === void 0 ? void 0 : user_id.user_id;
            const colleagueUUID = colleague_id === null || colleague_id === void 0 ? void 0 : colleague_id.colleague_id;
            if (!userUUID || !colleagueUUID) {
                console.log("❌ Fout: De user_id of colleague_id ontbreekt in het request.");
                return req.reject(400, "user_id en colleague_id moeten correct worden opgegeven.");
            }
            console.log(`🔍 Validatie: Gebruiker ${userUUID} en Collega ${colleagueUUID}`);
            // ✅ Correcte database-query (gebruik de opgehaalde entities)
            const userExists = yield cds_1.default.transaction(req).run(SELECT.one.from(Users).where({ user_id: userUUID }));
            if (!userExists) {
                console.log(`❌ Fout: Gebruiker ${userUUID} bestaat niet.`);
                return req.reject(400, `Gebruiker met ID ${userUUID} bestaat niet.`);
            }
            const colleagueExists = yield cds_1.default.transaction(req).run(SELECT.one.from(Colleagues).where({ colleague_id: colleagueUUID }));
            if (!colleagueExists) {
                console.log(`❌ Fout: Collega ${colleagueUUID} bestaat niet.`);
                return req.reject(400, `Collega met ID ${colleagueUUID} bestaat niet.`);
            }
            console.log("✅ Gevalideerde data, followup wordt aangemaakt.");
            const newFollowup = {
                followup_id: cds_1.default.utils.uuid(),
                followup_message,
                date,
                user_id: { user_id: userUUID }, // 🔹 Correct als associatie-object
                colleague_id: { colleague_id: colleagueUUID } // 🔹 Correct als associatie-object
            };
            yield cds_1.default.transaction(req).run(INSERT.into(Followups).entries(newFollowup));
            return yield cds_1.default.transaction(req).run(SELECT.one.from(Followups).where({ followup_id: newFollowup.followup_id }));
        }));
        // ✅ PATCH Followup (Update)
        srv.on('PATCH', 'Followups', (req) => __awaiter(this, void 0, void 0, function* () {
            console.log("🚀 Ontvangen update-data:", req.data);
            const { followup_id } = req.data;
            if (!followup_id) {
                return req.reject(400, "followup_id is verplicht voor updates.");
            }
            const { Followups } = srv.entities;
            const existingFollowup = yield cds_1.default.transaction(req).run(SELECT.one.from(Followups).where({ followup_id }));
            if (!existingFollowup) {
                return req.reject(404, "Follow-up niet gevonden.");
            }
            // ✅ Voer de update uit
            yield cds_1.default.transaction(req).run(UPDATE(Followups).set(req.data).where({ followup_id }));
            // ✅ Retourneer de geüpdatete Followup
            return yield cds_1.default.transaction(req).run(SELECT.one.from(Followups).where({ followup_id }));
        }));
        // ✅ DELETE Followup
        srv.on('DELETE', 'Followups', (req) => __awaiter(this, void 0, void 0, function* () {
            const { followup_id } = req.data;
            if (!followup_id) {
                return req.reject(400, "followup_id is verplicht om te verwijderen.");
            }
            const existingFollowup = yield cds_1.default.transaction(req).run(SELECT.one.from(Followups).where({ followup_id }));
            if (!existingFollowup) {
                return req.reject(404, "Follow-up niet gevonden.");
            }
            yield cds_1.default.transaction(req).run(DELETE.from(Followups).where({ followup_id }));
            return { message: "Follow-up succesvol verwijderd." };
        }));
        // EVENTS
        // CREATE Events
        srv.on('CREATE', 'Events', (req) => __awaiter(this, void 0, void 0, function* () {
            console.log("🚀 Ontvangen event data:", req.data);
            const { event_name, event_description, event_date, event_hour } = req.data;
            if (!event_name || !event_description || !event_date || !event_hour) {
                return req.reject(400, "Vereiste velden ontbreken: event_name, event_description, event_date en event_hour zijn verplicht.");
            }
            const newEvent = {
                event_id: cds_1.default.utils.uuid(),
                event_name,
                event_description,
                event_date,
                event_hour
            };
            yield cds_1.default.transaction(req).run(INSERT.into('Events').entries(newEvent));
            return yield cds_1.default.transaction(req).run(SELECT.one.from('Events').where({ event_id: newEvent.event_id }));
        }));
        // PATCH Events
        srv.on('PATCH', 'Events', (req) => __awaiter(this, void 0, void 0, function* () {
            console.log("🚀 Ontvangen update-event data:", req.data);
            const { event_id } = req.data;
            if (!event_id) {
                return req.reject(400, "event_id is verplicht voor updates.");
            }
            const { Events } = srv.entities;
            const existingEvent = yield cds_1.default.transaction(req).run(SELECT.one.from(Events).where({ event_id }));
            if (!existingEvent) {
                return req.reject(404, "Event niet gevonden.");
            }
            yield cds_1.default.transaction(req).run(UPDATE(Events).set(req.data).where({ event_id }));
            return yield cds_1.default.transaction(req).run(SELECT.one.from(Events).where({ event_id }));
        }));
        // DELETE Events
        srv.on('DELETE', 'Events', (req) => __awaiter(this, void 0, void 0, function* () {
            console.log("🚀 Ontvangen delete-request voor event:", req.data);
            const { event_id } = req.data;
            if (!event_id) {
                return req.reject(400, "event_id is verplicht om te verwijderen.");
            }
            const { Events } = srv.entities;
            const existingEvent = yield cds_1.default.transaction(req).run(SELECT.one.from(Events).where({ event_id }));
            if (!existingEvent) {
                return req.reject(404, "Event niet gevonden.");
            }
            yield cds_1.default.transaction(req).run(DELETE.from(Events).where({ event_id }));
            return { message: "Event succesvol verwijderd." };
        }));
        // TAG
        // ✅ CREATE Tag
        srv.on('CREATE', 'Tags', (req) => __awaiter(this, void 0, void 0, function* () {
            console.log("🚀 Ontvangen tag-data:", req.data);
            const { tag_name, tag_description } = req.data;
            if (!tag_name || tag_name.trim() === "") {
                return req.reject(400, "tag_name is verplicht.");
            }
            const newTag = {
                tag_id: cds_1.default.utils.uuid(),
                tag_name,
                tag_description
            };
            yield cds_1.default.transaction(req).run(INSERT.into('Tags').entries(newTag));
            return yield cds_1.default.transaction(req).run(SELECT.one.from('Tags').where({ tag_id: newTag.tag_id }));
        }));
        // ✅ PATCH Tag (UPDATE)
        srv.on('PATCH', 'Tags', (req) => __awaiter(this, void 0, void 0, function* () {
            console.log("🚀 Ontvangen update-tag data:", req.data);
            const { tag_id } = req.data;
            if (!tag_id) {
                return req.reject(400, "tag_id is verplicht voor updates.");
            }
            const { Tags } = srv.entities;
            const existingTag = yield cds_1.default.transaction(req).run(SELECT.one.from(Tags).where({ tag_id }));
            if (!existingTag) {
                return req.reject(404, "Tag niet gevonden.");
            }
            yield cds_1.default.transaction(req).run(UPDATE(Tags).set(req.data).where({ tag_id }));
            return yield cds_1.default.transaction(req).run(SELECT.one.from(Tags).where({ tag_id }));
        }));
        // ✅ DELETE Tag
        srv.on('DELETE', 'Tags', (req) => __awaiter(this, void 0, void 0, function* () {
            console.log("🚀 Ontvangen delete-request voor tag:", req.data);
            const { tag_id } = req.data;
            if (!tag_id) {
                return req.reject(400, "tag_id is verplicht om te verwijderen.");
            }
            const { Tags } = srv.entities;
            const existingTag = yield cds_1.default.transaction(req).run(SELECT.one.from(Tags).where({ tag_id }));
            if (!existingTag) {
                return req.reject(404, "Tag niet gevonden.");
            }
            yield cds_1.default.transaction(req).run(DELETE.from(Tags).where({ tag_id }));
            return { message: "Tag succesvol verwijderd." };
        }));
        // USER_FOLLOWED_COLLEAGUE
        // ✅ CREATE User_Followed_Colleague (Gebruiker volgt een collega)
        srv.on('CREATE', 'User_Followed_Colleagues', (req) => __awaiter(this, void 0, void 0, function* () {
            console.log("🚀 Ontvangen follow-data:", req.data);
            const { user_id, colleague_id } = req.data;
            if (!user_id || !colleague_id) {
                return req.reject(400, "user_id en colleague_id zijn verplicht.");
            }
            const { Users, Colleagues, User_Followed_Colleagues } = srv.entities;
            // ✅ Controleer of user_id en colleague_id bestaan
            const userExists = yield cds_1.default.transaction(req).run(SELECT.one.from(Users).where({ user_id }));
            if (!userExists) {
                return req.reject(400, `Gebruiker met ID ${user_id} bestaat niet.`);
            }
            const colleagueExists = yield cds_1.default.transaction(req).run(SELECT.one.from(Colleagues).where({ colleague_id }));
            if (!colleagueExists) {
                return req.reject(400, `Collega met ID ${colleague_id} bestaat niet.`);
            }
            console.log(`✅ Validatie geslaagd: Gebruiker ${user_id} volgt Collega ${colleague_id}`);
            const newFollow = {
                id: cds_1.default.utils.uuid(),
                user_id,
                colleague_id
            };
            yield cds_1.default.transaction(req).run(INSERT.into(User_Followed_Colleagues).entries(newFollow));
            return yield cds_1.default.transaction(req).run(SELECT.one.from(User_Followed_Colleagues).where({ id: newFollow.id }));
        }));
        // ✅ DELETE User_Followed_Colleague (Gebruiker ontvolgt een collega)
        srv.on('DELETE', 'User_Followed_Colleagues', (req) => __awaiter(this, void 0, void 0, function* () {
            console.log("🚀 Ontvangen delete-request voor follow:", req.data);
            const { id } = req.data;
            if (!id) {
                return req.reject(400, "id is verplicht om een follow-verwijdering uit te voeren.");
            }
            const { User_Followed_Colleagues } = srv.entities;
            const existingFollow = yield cds_1.default.transaction(req).run(SELECT.one.from(User_Followed_Colleagues).where({ id }));
            if (!existingFollow) {
                return req.reject(404, "Deze follow-relatie bestaat niet.");
            }
            yield cds_1.default.transaction(req).run(DELETE.from(User_Followed_Colleagues).where({ id }));
            return { message: "Gebruiker is succesvol ontvolgd." };
        }));
        // TAGS_COLLEAGUES
        // CREATE
        srv.on('CREATE', 'Tags_Colleagues', (req) => __awaiter(this, void 0, void 0, function* () {
            console.log("🚀 Ontvangen data voor tag-collega koppeling:", req.data);
            const { colleague_id, tag_id } = req.data;
            if (!colleague_id || !tag_id) {
                return req.reject(400, "colleague_id en tag_id zijn verplicht.");
            }
            const { Colleagues, Tags, Tags_Colleagues } = srv.entities;
            // ✅ Controleer of de collega en tag bestaan
            const colleagueExists = yield cds_1.default.transaction(req).run(SELECT.one.from(Colleagues).where({ colleague_id }));
            if (!colleagueExists) {
                return req.reject(400, `Collega met ID ${colleague_id} bestaat niet.`);
            }
            const tagExists = yield cds_1.default.transaction(req).run(SELECT.one.from(Tags).where({ tag_id }));
            if (!tagExists) {
                return req.reject(400, `Tag met ID ${tag_id} bestaat niet.`);
            }
            console.log(`✅ Validatie geslaagd: Tag ${tag_id} wordt gekoppeld aan Collega ${colleague_id}`);
            const newTagColleague = {
                id: cds_1.default.utils.uuid(),
                colleague_id,
                tag_id
            };
            yield cds_1.default.transaction(req).run(INSERT.into(Tags_Colleagues).entries(newTagColleague));
            return yield cds_1.default.transaction(req).run(SELECT.one.from(Tags_Colleagues).where({ id: newTagColleague.id }));
        }));
        // DELETE
        srv.on('DELETE', 'Tags_Colleagues', (req) => __awaiter(this, void 0, void 0, function* () {
            console.log("🚀 Ontvangen delete-request voor tag-collega koppeling:", req.data);
            const { id } = req.data;
            if (!id) {
                return req.reject(400, "id is verplicht om een tag-koppeling te verwijderen.");
            }
            const { Tags_Colleagues } = srv.entities;
            const existingTagColleague = yield cds_1.default.transaction(req).run(SELECT.one.from(Tags_Colleagues).where({ id }));
            if (!existingTagColleague) {
                return req.reject(404, "Deze tag-koppeling bestaat niet.");
            }
            yield cds_1.default.transaction(req).run(DELETE.from(Tags_Colleagues).where({ id }));
            return { message: "Tag is succesvol van collega verwijderd." };
        }));
        //COLLEAGUE_EVENT
        //CREATE
        srv.on('CREATE', 'Colleague_Events', (req) => __awaiter(this, void 0, void 0, function* () {
            console.log("🚀 Ontvangen data voor collega-event koppeling:", req.data);
            const { colleague_id, event_id, presence } = req.data;
            if (!colleague_id || !event_id || presence === undefined) {
                return req.reject(400, "colleague_id, event_id en presence zijn verplicht.");
            }
            const { Colleagues, Events, Colleague_Events } = srv.entities;
            // ✅ Controleer of de collega en het event bestaan
            const colleagueExists = yield cds_1.default.transaction(req).run(SELECT.one.from(Colleagues).where({ colleague_id }));
            if (!colleagueExists) {
                return req.reject(400, `Collega met ID ${colleague_id} bestaat niet.`);
            }
            const eventExists = yield cds_1.default.transaction(req).run(SELECT.one.from(Events).where({ event_id }));
            if (!eventExists) {
                return req.reject(400, `Event met ID ${event_id} bestaat niet.`);
            }
            console.log(`✅ Validatie geslaagd: Collega ${colleague_id} wordt gekoppeld aan Event ${event_id}`);
            const newColleagueEvent = {
                id: cds_1.default.utils.uuid(),
                colleague_id,
                event_id,
                presence
            };
            yield cds_1.default.transaction(req).run(INSERT.into(Colleague_Events).entries(newColleagueEvent));
            return yield cds_1.default.transaction(req).run(SELECT.one.from(Colleague_Events).where({ id: newColleagueEvent.id }));
        }));
        //PATCH
        srv.on('PATCH', 'Colleague_Events', (req) => __awaiter(this, void 0, void 0, function* () {
            console.log("🚀 Ontvangen update voor collega-event koppeling:", req.data);
            const { id, presence } = req.data;
            if (!id) {
                return req.reject(400, "id is verplicht voor updates.");
            }
            if (presence === undefined) {
                return req.reject(400, "presence is verplicht bij het bijwerken.");
            }
            const { Colleague_Events } = srv.entities;
            const existingColleagueEvent = yield cds_1.default.transaction(req).run(SELECT.one.from(Colleague_Events).where({ id }));
            if (!existingColleagueEvent) {
                return req.reject(404, "Deze collega-event koppeling bestaat niet.");
            }
            yield cds_1.default.transaction(req).run(UPDATE(Colleague_Events).set({ presence }).where({ id }));
            return yield cds_1.default.transaction(req).run(SELECT.one.from(Colleague_Events).where({ id }));
        }));
        //DELETE
        srv.on('DELETE', 'Colleague_Events', (req) => __awaiter(this, void 0, void 0, function* () {
            console.log("🚀 Ontvangen delete-request voor collega-event koppeling:", req.data);
            const { id } = req.data;
            if (!id) {
                return req.reject(400, "id is verplicht om een collega uit een event te verwijderen.");
            }
            const { Colleague_Events } = srv.entities;
            const existingColleagueEvent = yield cds_1.default.transaction(req).run(SELECT.one.from(Colleague_Events).where({ id }));
            if (!existingColleagueEvent) {
                return req.reject(404, "Deze collega-event koppeling bestaat niet.");
            }
            yield cds_1.default.transaction(req).run(DELETE.from(Colleague_Events).where({ id }));
            return { message: "Collega is succesvol uit het event verwijderd." };
        }));
    });
}
