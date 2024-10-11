'use client';

import GitHubButton from 'react-github-btn';


export default function GitHubStarsButton()
{
    return <GitHubButton
        href="https://github.com/Angus-Moore-Dev/Supacord"
        data-color-scheme="no-preference: dark; light: light; dark: dark;"
        data-size="large"
        data-show-count="true"
        aria-label="Star Angus-Moore-Dev/Supacord on GitHub"
    >
        &nbsp;&nbsp;GitHub Stars
    </GitHubButton>;
}