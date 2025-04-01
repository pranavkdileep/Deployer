CREATE TABLE projects (
    id SERIAL PRIMARY KEY, -- Automatically generates unique IDs
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    name VARCHAR(255) NOT NULL,
    container_id VARCHAR(255),
    dockerfile TEXT,
    buildstatus VARCHAR(50),
    runstatus VARCHAR(50),
    description TEXT,
    open_domain TEXT,
    ishttps BOOLEAN,
    hostport INTEGER,
    sourcestatus VARCHAR(50),
    port INTEGER,
    deploytype VARCHAR(50),
    sourcepath TEXT,
    pkgs VARCHAR(100),
    apts VARCHAR(100),
    install_cmd VARCHAR(100),
    build_cmd VARCHAR(100),
    start_cmd VARCHAR(100),
    cpureservation INTEGER DEFAULT 0,
    memoryreservation INTEGER DEFAULT 0,
    cpulimit INTEGER DEFAULT 0,
    memorylimit INTEGER DEFAULT 0
);
CREATE TABLE deployments (
    id SERIAL PRIMARY KEY, -- Automatically generates unique IDs
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50),
    log TEXT
);

CREATE TABLE traffic (
    id SERIAL PRIMARY KEY, -- Automatically generates unique IDs
    name VARCHAR(255) NOT NULL,
    srcip VARCHAR(255),
    country VARCHAR(255),
    timesta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    useragent TEXT,
    browser TEXT,
    browserversion TEXT,
    os TEXT,
    device TEXT,
    fullurl TEXT
);