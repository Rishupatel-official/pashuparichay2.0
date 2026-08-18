// ======================================================
// PASHU PARICHAY
// FARMER DASHBOARD
// ======================================================


// ======================================================
// FIREBASE
// ======================================================

import {
    auth,
    db
} from "./firebase.js";


import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";


import {
    collection,
    getDocs,
    getDoc,
    doc,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


// ======================================================
// GLOBAL VARIABLES
// ======================================================

let currentFarmer = null;

let currentAnimals = [];


// ======================================================
// AUTHENTICATION
// ======================================================

onAuthStateChanged(
    auth,
    async (user) => {

        // ----------------------------------------------
        // USER NOT LOGGED IN
        // ----------------------------------------------

        if (!user) {

            window.location.href =
                "index.html";

            return;
        }


        console.log(
            "Logged in Firebase UID:",
            user.uid
        );


        try {

            // ------------------------------------------
            // FIND FARMER
            // ------------------------------------------

            currentFarmer =
                await findFarmer(
                    user.uid
                );


            // ------------------------------------------
            // FARMER NOT FOUND
            // ------------------------------------------

            if (!currentFarmer) {

                console.error(
                    "Farmer profile not found."
                );


                alert(
                    "Farmer profile could not be found."
                );


                await signOut(auth);


                window.location.href =
                    "index.html";


                return;
            }


            console.log(
                "Current farmer:",
                currentFarmer
            );


            // ------------------------------------------
            // LOAD PROFILE
            // ------------------------------------------

            loadFarmerInformation();


            // ------------------------------------------
            // LOAD ANIMALS
            // ------------------------------------------

            await loadAnimals();

        }


        catch (error) {

            console.error(
                "Farmer initialization error:",
                error
            );


            alert(
                "Unable to load your account."
            );

        }

    }
);


// ======================================================
// FIND FARMER
// ======================================================

async function findFarmer(uid) {

    try {

        console.log(
            "Looking for farmer UID:",
            uid
        );


        // =================================================
        // FARMER PROFILE
        //
        // users/{UID}
        // =================================================

        const farmerRef =
            doc(
                db,
                "users",
                uid
            );


        const farmerSnap =
            await getDoc(
                farmerRef
            );


        // ----------------------------------------------
        // USER DOCUMENT DOES NOT EXIST
        // ----------------------------------------------

        if (!farmerSnap.exists()) {

            console.error(
                "No Firestore user document found for UID:",
                uid
            );


            return null;
        }


        const farmerData =
            farmerSnap.data();


        console.log(
            "Farmer Firestore data:",
            farmerData
        );


        // ----------------------------------------------
        // CHECK ROLE
        // ----------------------------------------------

        if (
            farmerData.role !==
            "farmer"
        ) {

            console.error(
                "User exists but role is:",
                farmerData.role
            );


            return null;
        }


        return {

            id:
                farmerSnap.id,

            ...farmerData

        };

    }


    catch (error) {

        console.error(
            "Error finding farmer:",
            error
        );


        return null;
    }

}


// ======================================================
// LOAD FARMER INFORMATION
// ======================================================

function loadFarmerInformation() {

    if (!currentFarmer) {

        return;
    }


    const name =
        currentFarmer.name ||
        "Farmer";


    const customerId =
        currentFarmer.customerId ||
        "—";


    // ----------------------------------------------
    // FARMER NAME
    // ----------------------------------------------

    const farmerName =
        document.getElementById(
            "farmerName"
        );


    if (farmerName) {

        farmerName.textContent =
            name;

    }


    // ----------------------------------------------
    // WELCOME NAME
    // ----------------------------------------------

    const welcomeName =
        document.getElementById(
            "welcomeName"
        );


    if (welcomeName) {

        welcomeName.textContent =
            name;

    }


    // ----------------------------------------------
    // CUSTOMER ID
    // ----------------------------------------------

    const customerIdElement =
        document.getElementById(
            "customerId"
        );


    if (customerIdElement) {

        customerIdElement.textContent =
            customerId;

    }


    // ----------------------------------------------
    // WELCOME CUSTOMER ID
    // ----------------------------------------------

    const welcomeCustomerId =
        document.getElementById(
            "welcomeCustomerId"
        );


    if (welcomeCustomerId) {

        welcomeCustomerId.textContent =
            customerId;

    }

}


// ======================================================
// LOAD ANIMALS
// ======================================================

async function loadAnimals() {

    if (!currentFarmer) {

        console.error(
            "No current farmer."
        );


        return;
    }


    const animalList =
        document.getElementById(
            "animalList"
        );


    try {

        console.log(
            "Loading animals for farmer:",
            currentFarmer.id
        );


        // =================================================
        // ANIMALS ARE STORED AT:
        //
        // users/{farmerUID}/livestock/{animalID}
        // =================================================

        const livestockRef =
            collection(
                db,
                "users",
                currentFarmer.id,
                "livestock"
            );


        const snapshot =
            await getDocs(
                livestockRef
            );


        console.log(
            "Livestock documents found:",
            snapshot.size
        );


        // ----------------------------------------------
        // STORE ANIMALS
        // ----------------------------------------------

        currentAnimals =
            snapshot.docs.map(
                animalDoc => ({

                    id:
                        animalDoc.id,

                    ...animalDoc.data()

                })
            );


        console.log(
            "Current animals:",
            currentAnimals
        );


        // ----------------------------------------------
        // UPDATE BASIC STATISTICS
        // ----------------------------------------------

        updateStatistics();


        // ----------------------------------------------
        // DISPLAY ANIMALS
        // ----------------------------------------------

        renderAnimals();

    }


    catch (error) {

        console.error(
            "Error loading livestock:",
            error
        );


        if (animalList) {

            animalList.innerHTML = `

                <div class="empty-state">

                    <div>
                        ⚠️
                    </div>

                    <h4>
                        Unable to load animals
                    </h4>

                    <p>
                        ${escapeHtml(
                            error.message ||
                            "Please try again."
                        )}
                    </p>

                </div>

            `;

        }

    }

}


// ======================================================
// GLOBAL REFRESH
// ======================================================

window.loadAnimals =
    loadAnimals;


// ======================================================
// BASIC STATISTICS ONLY
//
// Advanced breed/state statistics are intentionally
// NOT included in the Farmer portal.
//
// Advanced Statistics belongs to Officials only.
// ======================================================

function updateStatistics() {

    const total =
        currentAnimals.length;


    // ----------------------------------------------
    // CATTLE
    // ----------------------------------------------

    const cattle =
        currentAnimals.filter(
            animal =>
                normalize(
                    animal.species
                ) ===
                "cattle"
        ).length;


    // ----------------------------------------------
    // BUFFALO
    // ----------------------------------------------

    const buffalo =
        currentAnimals.filter(
            animal =>
                normalize(
                    animal.species
                ) ===
                "buffalo"
        ).length;


    // ----------------------------------------------
    // UPDATE HTML
    // ----------------------------------------------

    setText(
        "totalAnimals",
        total
    );


    setText(
        "totalCattle",
        cattle
    );


    setText(
        "totalBuffalo",
        buffalo
    );

}


// ======================================================
// RENDER ANIMALS
// ======================================================

function renderAnimals() {

    const animalList =
        document.getElementById(
            "animalList"
        );


    if (!animalList) {

        return;
    }


    // ----------------------------------------------
    // NO ANIMALS
    // ----------------------------------------------

    if (
        currentAnimals.length ===
        0
    ) {

        animalList.innerHTML = `

            <div class="empty-state">

                <div>
                    🐄
                </div>

                <h4>
                    No animals registered yet
                </h4>

                <p>
                    Your registered cattle and
                    buffalo will appear here.
                </p>

            </div>

        `;


        return;
    }


    // ----------------------------------------------
    // CLEAR OLD CARDS
    // ----------------------------------------------

    animalList.innerHTML =
        "";


    // ----------------------------------------------
    // CREATE ANIMAL CARDS
    // ----------------------------------------------

    currentAnimals.forEach(
        animal => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "animal-card";


            card.onclick =
                () => {

                    openAnimalDetails(
                        animal
                    );

                };


            // ------------------------------------------
            // PHOTO
            // ------------------------------------------

            let photo;


            if (
                animal.photoUrl
            ) {

                photo = `

                    <img
                        src="${escapeHtml(
                            animal.photoUrl
                        )}"
                        alt="Animal"
                    >

                `;

            }


            else {

                photo = `

                    <div
                        class="animal-placeholder"
                    >

                        ${getAnimalEmoji(
                            animal.species
                        )}

                    </div>

                `;

            }


            // ------------------------------------------
            // CARD
            // ------------------------------------------

            card.innerHTML = `

                <div class="animal-photo">

                    ${photo}

                </div>


                <div class="animal-info">


                    <h4>

                        ${escapeHtml(

                            animal.identificationNumber ||

                            animal.animalId ||

                            "Animal"

                        )}

                    </h4>


                    <p>

                        Species:

                        ${escapeHtml(
                            animal.species ||
                            "Unknown"
                        )}

                    </p>


                    <p>

                        Breed:

                        ${escapeHtml(
                            animal.breed ||
                            "Unknown"
                        )}

                    </p>


                    <p>

                        Registered:

                        ${formatDate(
                            animal.registeredAt ||
                            animal.capturedAt
                        )}

                    </p>


                    <span
                        class="breed-badge"
                    >

                        ${escapeHtml(
                            animal.breed ||
                            "Breed pending"
                        )}

                    </span>


                </div>

            `;


            animalList.appendChild(
                card
            );

        }
    );

}


// ======================================================
// OPEN ANIMAL DETAILS
// ======================================================

function openAnimalDetails(
    animal
) {

    const modal =
        document.getElementById(
            "animalModal"
        );


    const details =
        document.getElementById(
            "animalDetails"
        );


    if (
        !modal ||
        !details
    ) {

        console.log(
            "Animal modal elements not found."
        );


        return;
    }


    // ----------------------------------------------
    // PHOTO
    // ----------------------------------------------

    let photo;


    if (
        animal.photoUrl
    ) {

        photo = `

            <img
                src="${escapeHtml(
                    animal.photoUrl
                )}"
                alt="Animal"
            >

        `;

    }


    else {

        photo = `

            <div
                class="detail-placeholder"
            >

                ${getAnimalEmoji(
                    animal.species
                )}

            </div>

        `;

    }


    // ----------------------------------------------
    // AI CONFIDENCE
    // ----------------------------------------------

    let confidence =
        "—";


    if (
        animal.confidence !==
            undefined &&

        animal.confidence !==
            null
    ) {

        let value =
            Number(
                animal.confidence
            );


        // Teachable Machine normally
        // returns confidence between 0 and 1.

        if (
            value <=
            1
        ) {

            value =
                value *
                100;

        }


        confidence =
            value.toFixed(
                2
            ) +
            "%";

    }


    // ----------------------------------------------
    // DETAILS
    // ----------------------------------------------

    details.innerHTML = `

        <div class="detail-photo">

            ${photo}

        </div>


        <h2>

            ${escapeHtml(

                animal.identificationNumber ||

                animal.animalId ||

                "Animal"

            )}

        </h2>


        <p class="modal-subtitle">

            Livestock record

        </p>


        <div class="detail-grid">


            <!-- SPECIES -->

            <div class="detail-item">

                <small>
                    Species
                </small>

                <strong>

                    ${escapeHtml(
                        animal.species ||
                        "Unknown"
                    )}

                </strong>

            </div>


            <!-- BREED -->

            <div class="detail-item">

                <small>
                    Breed
                </small>

                <strong>

                    ${escapeHtml(
                        animal.breed ||
                        "Unknown"
                    )}

                </strong>

            </div>


            <!-- AI CONFIDENCE -->

            <div class="detail-item">

                <small>
                    AI Confidence
                </small>

                <strong>

                    ${confidence}

                </strong>

            </div>


            <!-- GENDER -->

            <div class="detail-item">

                <small>
                    Gender
                </small>

                <strong>

                    ${escapeHtml(
                        animal.gender ||
                        "Unknown"
                    )}

                </strong>

            </div>


            <!-- AGE -->

            <div class="detail-item">

                <small>
                    Age
                </small>

                <strong>

                    ${
                        animal.age !==
                        undefined

                            ? escapeHtml(
                                String(
                                    animal.age
                                )
                            ) +
                            " years"

                            : "—"
                    }

                </strong>

            </div>


            <!-- REGISTERED -->

            <div class="detail-item">

                <small>
                    Registered
                </small>

                <strong>

                    ${formatDate(
                        animal.registeredAt ||
                        animal.capturedAt
                    )}

                </strong>

            </div>


        </div>

    `;


    modal.classList.remove(
        "hidden"
    );

}


// ======================================================
// GLOBAL
// ======================================================

window.openAnimalDetails =
    openAnimalDetails;


// ======================================================
// CLOSE ANIMAL MODAL
// ======================================================

function closeAnimalModal() {

    const modal =
        document.getElementById(
            "animalModal"
        );


    if (modal) {

        modal.classList.add(
            "hidden"
        );

    }

}


window.closeAnimalModal =
    closeAnimalModal;


// ======================================================
// HELP / SEND MESSAGE
// ======================================================

function sendMessage() {

    const modal =
        document.getElementById(
            "helpModal"
        );


    if (modal) {

        modal.classList.remove(
            "hidden"
        );

    }

}


window.sendMessage =
    sendMessage;


// ======================================================
// CLOSE HELP MODAL
// ======================================================

function closeHelpModal() {

    const modal =
        document.getElementById(
            "helpModal"
        );


    if (modal) {

        modal.classList.add(
            "hidden"
        );

    }

}


window.closeHelpModal =
    closeHelpModal;


// ======================================================
// HELP FORM
// ======================================================

const helpForm =
    document.getElementById(
        "helpForm"
    );


if (helpForm) {

    helpForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const messageElement =
                document.getElementById(
                    "helpMessage"
                );


            const message =
                messageElement
                    ? messageElement.value.trim()
                    : "";


            if (!message) {

                alert(
                    "Please enter your message."
                );


                return;
            }


            if (!currentFarmer) {

                alert(
                    "Farmer profile not loaded."
                );


                return;
            }


            try {

                await addDoc(
                    collection(
                        db,
                        "supportTickets"
                    ),
                    {

                        farmerId:
                            currentFarmer.id,

                        customerId:
                            currentFarmer.customerId,

                        farmerName:
                            currentFarmer.name,

                        message:
                            message,

                        type:
                            "message",

                        status:
                            "pending",

                        createdAt:
                            serverTimestamp()

                    }
                );


                alert(
                    "Your message has been sent to an official."
                );


                helpForm.reset();


                closeHelpModal();

            }


            catch (error) {

                console.error(
                    "Support error:",
                    error
                );


                alert(
                    "Unable to send your message."
                );

            }

        }
    );

}


// ======================================================
// REQUEST CALL
// ======================================================

async function requestCall() {

    if (!currentFarmer) {

        alert(
            "Farmer profile not loaded."
        );


        return;
    }


    const confirmRequest =
        confirm(
            "Would you like to request a call from an official?"
        );


    if (!confirmRequest) {

        return;
    }


    try {

        await addDoc(
            collection(
                db,
                "supportTickets"
            ),
            {

                farmerId:
                    currentFarmer.id,

                customerId:
                    currentFarmer.customerId,

                farmerName:
                    currentFarmer.name,

                phone:
                    currentFarmer.phone,

                type:
                    "call",

                status:
                    "pending",

                createdAt:
                    serverTimestamp()

            }
        );


        alert(
            "Your call request has been sent."
        );

    }


    catch (error) {

        console.error(
            "Call request error:",
            error
        );


        alert(
            "Unable to submit call request."
        );

    }

}


window.requestCall =
    requestCall;


// ======================================================
// SHOW DASHBOARD
// ======================================================

function showDashboard() {

    window.scrollTo({

        top:
            0,

        behavior:
            "smooth"

    });

}


window.showDashboard =
    showDashboard;


// ======================================================
// SHOW ANIMALS
// ======================================================

function showAnimals() {

    const animalList =
        document.getElementById(
            "animalList"
        );


    if (animalList) {

        animalList.scrollIntoView({

            behavior:
                "smooth"

        });

    }

}


window.showAnimals =
    showAnimals;


// ======================================================
// PROFILE
// ======================================================

function showProfile() {

    alert(
        "Profile page will be built next."
    );

}


window.showProfile =
    showProfile;


// ======================================================
// HELP
// ======================================================

function showHelp() {

    const helpSection =
        document.querySelector(
            ".help-section"
        );


    if (helpSection) {

        helpSection.scrollIntoView({

            behavior:
                "smooth"

        });

    }

}


window.showHelp =
    showHelp;


// ======================================================
// NOTIFICATIONS
// ======================================================

function showNotifications() {

    alert(
        "Notifications will be connected next."
    );

}


window.showNotifications =
    showNotifications;


// ======================================================
// LOGOUT
// ======================================================

async function logout() {

    try {

        await signOut(
            auth
        );


        sessionStorage.clear();


        window.location.href =
            "index.html";

    }


    catch (error) {

        console.error(
            "Logout error:",
            error
        );


        alert(
            "Unable to logout. Please try again."
        );

    }

}


window.logout =
    logout;


// ======================================================
// HELPERS
// ======================================================


// ======================================================
// NORMALIZE
// ======================================================

function normalize(
    value
) {

    return String(
        value ||
        ""
    )
        .trim()
        .toLowerCase();

}


// ======================================================
// SET TEXT
// ======================================================

function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            value;

    }

}


// ======================================================
// ANIMAL EMOJI
// ======================================================

function getAnimalEmoji(
    species
) {

    const value =
        String(
            species ||
            ""
        ).toLowerCase();


    if (
        value ===
        "buffalo"
    ) {

        return "🐃";

    }


    if (
        value ===
        "cattle"
    ) {

        return "🐄";

    }


    return "🐄";

}


// ======================================================
// DATE FORMAT
// ======================================================

function formatDate(
    timestamp
) {

    if (!timestamp) {

        return "—";

    }


    try {

        const date =
            timestamp.toDate
                ? timestamp.toDate()
                : new Date(
                    timestamp
                );


        return date.toLocaleString(
            "en-IN",
            {

                dateStyle:
                    "medium",

                timeStyle:
                    "short"

            }
        );

    }


    catch {

        return "—";

    }

}


// ======================================================
// HTML ESCAPING
// ======================================================

function escapeHtml(
    value
) {

    return String(
        value
    )

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}