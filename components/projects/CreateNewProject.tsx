'use client';

import { Button, Modal } from '@mantine/core';
import { Plus } from 'lucide-react';
import NewProjectImport from './NewProjectImport';
import { useDisclosure } from '@mantine/hooks';


export default function CreateNewProject()
{
    const [opened, { open, close }] = useDisclosure();

    return <>
        <Button rightSection={<Plus />} onClick={open}>
            Add Supabase Project
        </Button>
        <Modal opened={opened} onClose={close} size={'lg'} p={'lg'} centered lockScroll withCloseButton={false}>
            <NewProjectImport />
        </Modal>
    </>;
}