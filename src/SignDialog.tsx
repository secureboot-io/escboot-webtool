import { Button, Code, Divider, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Switch, Textarea, useDisclosure } from '@nextui-org/react';
import React, { useEffect } from 'react';
import { DeviceInfo } from './FourWay';

interface ConfirmDialogProps {
    open?: boolean;
    deviceInfo: DeviceInfo
}

const SignDialog: React.FC<ConfirmDialogProps> = ({
    open = false
}) => {

    const [isOpen, setIsOpen] = React.useState(open);
    const [confirmDisabled, setConfirmDisabled] = React.useState(true);
    useEffect(() => {
        if (open) {
            setConfirmDisabled(true);
            setIsOpen(true);
        } else {
            setIsOpen(false);
        }
    }, [open]);

    const handleCancel = () => {
        open = false;
        setIsOpen(false);
    }

    const handleSign = () => {
        open = false;
        setIsOpen(false);
    }

    return (
        <Modal className='dark text-foreground' isOpen={isOpen} size='5xl'>
            <ModalContent>
                <ModalHeader>Sign</ModalHeader>
                <ModalBody className='flex flex-col gap-4'>
                    <Code />
                    
                </ModalBody>
                <ModalFooter>
                    <Button color="danger" variant="light" onClick={handleCancel}>Cancel</Button>
                    <Button color="warning" onClick={handleSign}>Sign</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default SignDialog;
