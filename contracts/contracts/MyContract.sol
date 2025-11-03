// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract EventTicketing is ERC721URIStorage, AccessControl {
    using Counters for Counters.Counter;

    // Roles
    bytes32 public constant USER_ROLE = keccak256("USER_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    address public admin;

    // Event & Ticket Structs
    struct Event {
        uint256 id;
        string name;
        string location;
        string description;
        uint256 date;
        uint256 time;
        uint256 ticketSupply;
        uint256 ticketPrice;
        uint256 ticketsSold;
        string imageUrl;
    }
    mapping(uint256 => Event) public events;
    Counters.Counter private eventIdCtr;
    Counters.Counter private ticketIdCtr;

    // Ticket NFT - ticketId is tokenId from ERC721
    mapping(uint256 => uint256) public ticketToEvent;
    mapping(uint256 => bool) public isTicketUsed;

    // Track ticket purchases
    mapping(address => uint256[]) public ownerTickets;

    // Total stats
    uint256 public totalTicketsSold;
    uint256 public totalRevenue;

    // Set role for each address only once
    mapping(address => bool) public hasRoleAssigned;

    // Events
    event EventCreated(uint256 indexed eventId);
    event TicketPurchased(address indexed buyer, uint256 indexed eventId, uint256 ticketId);
    event TicketVerified(address indexed verifier, uint256 indexed ticketId);

    // ADMIN: set at deploy time
    constructor(address _admin) ERC721("EventTicket", "ETKT") {
        admin = _admin;
        _setupRole(DEFAULT_ADMIN_ROLE, admin);
    }

    // --- Role Management ---
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    modifier onlyUser() {
        require(hasRole(USER_ROLE, msg.sender), "Only user");
        _;
    }
    modifier onlyVerifier() {
        require(hasRole(VERIFIER_ROLE, msg.sender), "Only verifier");
        _;
    }

    function selectRole(uint8 roleType) external {
        require(!hasRoleAssigned[msg.sender], "Role already assigned");
        require(msg.sender != admin, "Admin can't choose user/verifier role");
        if (roleType == 1) {
            _setupRole(USER_ROLE, msg.sender);
        } else if (roleType == 2) {
            _setupRole(VERIFIER_ROLE, msg.sender);
        } else {
            revert("Invalid role");
        }
        hasRoleAssigned[msg.sender] = true;
    }

    // --- Event Management ---
    function createEvent(
        string memory name,
        string memory location,
        string memory description,
        uint256 date,
        uint256 time,
        uint256 ticketSupply,
        uint256 ticketPrice,
        string memory imageUrl // Pinata IPFS URL
    ) public onlyAdmin {
        eventIdCtr.increment();
        uint256 newEventId = eventIdCtr.current();
        events[newEventId] = Event(
            newEventId, name, location, description,
            date, time, ticketSupply, ticketPrice, 0, imageUrl
        );
        emit EventCreated(newEventId);
    }

    function getEvent(uint256 eventId) external view returns (Event memory) {
        return events[eventId];
    }

    function getTotalEvents() external view returns (uint256) {
        return eventIdCtr.current();
    }

    // --- User Functions ---
    function buyTicket(uint256 eventId, string memory tokenURI) public payable onlyUser {
        Event storage ev = events[eventId];
        require(ev.id != 0, "Event does not exist");
        require(ev.ticketsSold < ev.ticketSupply, "Sold out");
        require(msg.value >= ev.ticketPrice, "Insufficient ETH");
        // Mint NFT as ticket
        ticketIdCtr.increment();
        uint256 ticketId = ticketIdCtr.current();
        _mint(msg.sender, ticketId);
        _setTokenURI(ticketId, tokenURI); // tokenURI has QR code if needed
        ticketToEvent[ticketId] = eventId;
        ev.ticketsSold += 1;
        ownerTickets[msg.sender].push(ticketId);
        totalTicketsSold += 1;
        totalRevenue += msg.value;
        emit TicketPurchased(msg.sender, eventId, ticketId);
    }

    function getMyTickets() public view returns (uint256[] memory) {
        return ownerTickets[msg.sender];
    }

    // Helper for UIs/explorers to fetch tickets for any address (does not rely on msg.sender)
    function getTicketsOf(address user) external view returns (uint256[] memory) {
        return ownerTickets[user];
    }

    // --- Verifier Functions ---
    function verifyTicket(uint256 ticketId) public onlyVerifier {
        require(_exists(ticketId), "No such ticket");
        require(!isTicketUsed[ticketId], "Already used");
        isTicketUsed[ticketId] = true;
        emit TicketVerified(msg.sender, ticketId);
    }

    function checkTicketUsed(uint256 ticketId) public view returns (bool) {
        return isTicketUsed[ticketId];
    }

    // --- Admin Stats ---
    function getAdminStats() public view onlyAdmin returns (uint256, uint256, uint256) {
        return (eventIdCtr.current(), totalTicketsSold, totalRevenue);
    }

     function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
