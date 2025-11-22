export interface UserProfile {
    uid: string;
    displayName: string;
    email: string;
    photoURL: string;
    department?: string;
    createdAt: number;
}

export interface GameState {
    uid: string; // The player
    board: string[]; // Array of UIDs representing the 5x5 grid (25 items)
    collectedUids: string[]; // List of UIDs scanned
    isBingo: boolean;
    lastUpdated: number;
}
