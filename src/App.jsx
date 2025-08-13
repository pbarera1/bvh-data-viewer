import BvhDisplay from './BvhDisplay.jsx';
import {useEffect, useRef, useState, useMemo} from 'react';
import GithubIcon from './GithubIcon';

export default function App() {
    return (
        <div
            style={{
                width: '100vw',
                height: '100vh',
                display: 'grid',
                gridTemplateRows: 'auto 1fr',
            }}>
            <a
                className="github"
                href="https://github.com/pbarera1/bvh-data-viewer"
                target="_blank"
                rel="noopener">
                <GithubIcon />
            </a>
            <BvhDisplay />
        </div>
    );
}
