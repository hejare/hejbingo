import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { UserProfile } from "@/types";

export async function seedUsers() {
    const departments = ["Sales", "Engineering", "HR", "Marketing", "Management"];

    for (let i = 1; i <= 25; i++) {
        const uid = `dummy_user_${i}`;
        const name = `Colleague ${i}`;
        const dept = departments[Math.floor(Math.random() * departments.length)];

        const user: UserProfile = {
            uid,
            displayName: name,
            email: `colleague${i}@example.com`,
            photoURL: `https://ui-avatars.com/api/?name=${name}&background=random`,
            department: dept,
            createdAt: Date.now(),
        };

        await setDoc(doc(db, "users", uid), user);
    }

    console.log("Seeded 25 users!");
}
