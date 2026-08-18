const {
    onCall,
    HttpsError
} = require("firebase-functions/v2/https");

const {
    initializeApp
} = require("firebase-admin/app");

const {
    getAuth
} = require("firebase-admin/auth");

const {
    getFirestore,
    FieldValue
} = require("firebase-admin/firestore");

const {
    setGlobalOptions
} = require("firebase-functions/v2");


// ======================================================
// INITIALIZE FIREBASE ADMIN
// ======================================================

initializeApp();


// ======================================================
// GLOBAL OPTIONS
// ======================================================

setGlobalOptions({
    region: "asia-south1",
    maxInstances: 10
});


// ======================================================
// CREATE FARMER
// ======================================================

exports.createFarmer = onCall(
    async (request) => {

        // ------------------------------------------------
        // 1. CHECK AUTHENTICATION
        // ------------------------------------------------

        if (!request.auth) {

            throw new HttpsError(
                "unauthenticated",
                "You must be logged in."
            );

        }


        const officialUid =
            request.auth.uid;


        // ------------------------------------------------
        // 2. CHECK THAT CALLER IS AN OFFICIAL
        // ------------------------------------------------

        const db =
            getFirestore();


        const officialDoc =
            await db
                .collection("users")
                .doc(officialUid)
                .get();


        if (!officialDoc.exists) {

            throw new HttpsError(
                "permission-denied",
                "Official profile not found."
            );

        }


        const officialData =
            officialDoc.data();


        if (
            officialData.role !==
            "official"
        ) {

            throw new HttpsError(
                "permission-denied",
                "Only officials can register farmers."
            );

        }


        // ------------------------------------------------
        // 3. GET DATA FROM FRONTEND
        // ------------------------------------------------

        const data =
            request.data || {};


        const name =
            String(data.name || "").trim();


        const phone =
            String(data.phone || "").trim();


        const email =
            String(data.email || "")
                .trim()
                .toLowerCase();


        const address =
            String(data.address || "").trim();


        const password =
            String(data.password || "");


        // ------------------------------------------------
        // 4. VALIDATION
        // ------------------------------------------------

        if (!name) {

            throw new HttpsError(
                "invalid-argument",
                "Farmer name is required."
            );

        }


        if (!phone) {

            throw new HttpsError(
                "invalid-argument",
                "Farmer phone number is required."
            );

        }


        if (!email) {

            throw new HttpsError(
                "invalid-argument",
                "Farmer email is required."
            );

        }


        if (!address) {

            throw new HttpsError(
                "invalid-argument",
                "Farmer address is required."
            );

        }


        if (
            password.length < 6
        ) {

            throw new HttpsError(
                "invalid-argument",
                "Password must contain at least 6 characters."
            );

        }


        // ------------------------------------------------
        // 5. GENERATE CUSTOMER ID
        // ------------------------------------------------

        let customerId;

        let exists = true;


        while (exists) {

            const randomNumber =
                Math.floor(
                    100000 +
                    Math.random() * 900000
                );


            customerId =
                "PP-" +
                randomNumber;


            const existing =
                await db
                    .collection("farmers")
                    .where(
                        "customerId",
                        "==",
                        customerId
                    )
                    .limit(1)
                    .get();


            exists =
                !existing.empty;

        }


        // ------------------------------------------------
        // 6. CREATE FIREBASE AUTH USER
        // ------------------------------------------------

        let userRecord;


        try {

            userRecord =
                await getAuth()
                    .createUser({

                        email: email,

                        password: password,

                        displayName: name,

                        phoneNumber:
                            phone.startsWith("+")
                                ? phone
                                : undefined

                    });

        }

        catch (error) {

            console.error(
                "Auth creation error:",
                error
            );


            if (
                error.code ===
                "auth/email-already-exists"
            ) {

                throw new HttpsError(
                    "already-exists",
                    "An account already exists with this email."
                );

            }


            if (
                error.code ===
                "auth/invalid-password"
            ) {

                throw new HttpsError(
                    "invalid-argument",
                    "The password is invalid."
                );

            }


            throw new HttpsError(
                "internal",
                "Unable to create authentication account."
            );

        }


        // ------------------------------------------------
        // 7. CREATE FARMER PROFILE
        // ------------------------------------------------

        const farmerRef =
            db
                .collection("farmers")
                .doc();


        const farmerData = {

            customerId:
                customerId,

            authUid:
                userRecord.uid,

            name:
                name,

            phone:
                phone,

            email:
                email,

            address:
                address,

            totalCattle:
                0,

            totalBuffalo:
                0,

            createdAt:
                FieldValue.serverTimestamp(),

            createdBy:
                officialUid

        };


        // ------------------------------------------------
        // 8. CREATE FARMER + USERS DOCUMENT
        // ------------------------------------------------

        const batch =
            db.batch();


        batch.set(
            farmerRef,
            farmerData
        );


        batch.set(
            db
                .collection("users")
                .doc(userRecord.uid),

            {

                role:
                    "farmer",

                customerId:
                    customerId,

                email:
                    email,

                name:
                    name,

                phone:
                    phone,

                farmerDocId:
                    farmerRef.id,

                createdAt:
                    FieldValue.serverTimestamp()

            }

        );


        await batch.commit();


        // ------------------------------------------------
        // 9. RETURN RESULT
        // ------------------------------------------------

        return {

            success:
                true,

            customerId:
                customerId,

            farmerId:
                farmerRef.id,

            uid:
                userRecord.uid,

            message:
                "Farmer created successfully."

        };

    }
);