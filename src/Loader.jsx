import React from 'react';
import styled from 'styled-components';

const LoadingStyles = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto;

    @keyframes rotate {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(359deg);
        }
    }
    svg {
        animation: rotate 700ms linear infinite;
        width: 100%;
        height: 100%;
        max-width: 45px;
        max-height: 45px;
    }
`;

export default function Loading(props) {
    return (
        <LoadingStyles style={props?.style}>
            <svg
                version="1.1"
                id="Layer_1"
                x="0px"
                y="0px"
                viewBox="0 0 50 50"
                {...props}>
                <path
                    fill="none"
                    d="M6.4,25c0,5,2,9.6,5.3,13c0.1,0.1,0.1,0.1,0.2,0.2l26.3-26.3c-3.4-3.4-8-5.5-13.2-5.5C14.7,6.4,6.4,14.7,6.4,25
	z"
                />
                <path
                    fill={props?.fill || '#345D7C'}
                    d="M11.7,38C8.4,34.6,6.4,30,6.4,25C6.4,14.7,14.7,6.4,25,6.4c5.1,0,9.8,2.1,13.2,5.5L41,9
	c-4.1-4.1-9.8-6.6-16-6.6C12.5,2.4,2.4,12.5,2.4,25c0,6.1,2.4,11.6,6.3,15.7C8.8,40.8,8.9,40.9,9,41l2.8-2.8
	C11.8,38.1,11.7,38.1,11.7,38z"
                />
            </svg>
        </LoadingStyles>
    );
}
