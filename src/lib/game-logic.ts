import { UserProfile } from "@/types";

export function generateBoard(allUsers: UserProfile[], currentUserId: string): string[] {
    // Filter out current user
    const potentialTargets = allUsers.filter((u) => u.uid !== currentUserId);

    // Shuffle
    const shuffled = [...potentialTargets].sort(() => 0.5 - Math.random());

    // Take first 25 (or fill with empty strings if not enough)
    const board = shuffled.slice(0, 25).map(u => u.uid);

    // Pad if necessary (though ideally we have enough users)
    while (board.length < 25) {
        board.push("FREE_SPACE"); // Or duplicate? Let's use FREE_SPACE for now
    }

    return board;
}

export function checkBingo(board: string[], collectedUids: string[]): boolean {
    const size = 5;
    const isCollected = (uid: string) => collectedUids.includes(uid) || uid === "FREE_SPACE";

    // Check rows
    for (let i = 0; i < size; i++) {
        if (board.slice(i * size, (i + 1) * size).every(isCollected)) return true;
    }

    // Check columns
    for (let i = 0; i < size; i++) {
        if (Array.from({ length: size }, (_, j) => board[i + j * size]).every(isCollected)) return true;
    }

    // Check diagonals
    if (Array.from({ length: size }, (_, i) => board[i * (size + 1)]).every(isCollected)) return true;
    if (Array.from({ length: size }, (_, i) => board[(i + 1) * (size - 1)]).every(isCollected)) return true;

    return false;
}
