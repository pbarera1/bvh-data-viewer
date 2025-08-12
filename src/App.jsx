import BvhDisplay from './BvhDisplay.jsx';
import {useEffect, useRef, useState, useMemo} from 'react';

export default function App() {
    return (
        <div
            style={{
                width: '100vw',
                height: '100vh',
                display: 'grid',
                gridTemplateRows: 'auto 1fr',
            }}>
            <BvhDisplay />
        </div>
    );
}
